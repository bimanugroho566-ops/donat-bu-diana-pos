import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getSupabaseClient } from '../lib/supabase'
import { useProductStore } from './productStore'

function mapTransaction(row) {
  return {
    id: row.id,
    invoiceNo: row.invoice_no,
    customerId: row.customer_id,
    cashierId: row.cashier_id,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    cashierName: row.cashier_name,
    items: (row.transaction_items || []).map(item => ({
      id: item.id,
      productId: item.product_id,
      productName: item.product_name,
      quantity: Number(item.quantity),
      unit: item.unit,
      price: Number(item.price),
      costPrice: Number(item.cost_price),
      subtotal: Number(item.subtotal)
    })),
    totalItems: Number(row.total_items),
    subtotal: Number(row.subtotal),
    discount: Number(row.discount),
    grandTotal: Number(row.grand_total),
    totalCost: Number(row.total_cost),
    netProfit: Number(row.net_profit),
    paymentMethod: row.payment_method,
    paymentStatus: row.payment_status,
    cashPaid: Number(row.cash_paid),
    cashChange: Number(row.cash_change),
    status: row.status,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

export const useTransactionStore = defineStore('transaction', () => {
  const supabase = getSupabaseClient()
  const transactions = ref([])
  const isLoaded = ref(false)
  const loadError = ref('')

  async function loadTransactions() {
    const { data, error } = await supabase
      .from('transactions')
      .select('*, transaction_items(*)')
      .order('created_at', { ascending: false })

    if (error) {
      loadError.value = error.message
      throw new Error(`Gagal memuat transaksi Supabase: ${error.message}`)
    }

    transactions.value = data.map(mapTransaction)
    isLoaded.value = true
    loadError.value = ''
    return transactions.value
  }

  const allTransactions = computed(() => {
    return [...transactions.value].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  })

  const totalOrders = computed(() => transactions.value.length)

  const totalRevenue = computed(() => {
    return transactions.value
      .filter(transaction => transaction.status !== 'cancelled')
      .reduce((sum, transaction) => sum + Number(transaction.grandTotal || 0), 0)
  })

  const totalProfit = computed(() => {
    return transactions.value
      .filter(transaction => transaction.status !== 'cancelled')
      .reduce((sum, transaction) => sum + Number(transaction.netProfit || 0), 0)
  })

  const todayTransactions = computed(() => {
    const today = new Date().toISOString().slice(0, 10)
    return transactions.value.filter(transaction => {
      return (transaction.createdAt || '').slice(0, 10) === today && transaction.status !== 'cancelled'
    })
  })

  const todayRevenue = computed(() => {
    return todayTransactions.value.reduce((sum, transaction) => sum + Number(transaction.grandTotal || 0), 0)
  })

  const todayProfit = computed(() => {
    return todayTransactions.value.reduce((sum, transaction) => sum + Number(transaction.netProfit || 0), 0)
  })

  const topSellingProducts = computed(() => {
    const productSales = {}
    transactions.value
      .filter(transaction => transaction.status !== 'cancelled')
      .forEach(transaction => {
        transaction.items.forEach(item => {
          if (!productSales[item.productId]) {
            productSales[item.productId] = {
              id: item.productId,
              name: item.productName,
              totalQty: 0,
              totalRevenue: 0
            }
          }
          productSales[item.productId].totalQty += Number(item.quantity || 0)
          productSales[item.productId].totalRevenue += Number(item.subtotal || 0)
        })
      })

    return Object.values(productSales)
      .sort((a, b) => b.totalQty - a.totalQty)
      .slice(0, 5)
  })

  function getTransactionByIdOrInvoice(query) {
    if (!query) return null
    const normalized = query.trim().toUpperCase()
    return transactions.value.find(transaction =>
      transaction.id.toUpperCase() === normalized ||
      transaction.invoiceNo.toUpperCase() === normalized
    ) || null
  }

  async function fetchCreatedTransaction(rpcData) {
    const created = Array.isArray(rpcData) ? rpcData[0] : rpcData
    if (!created?.transaction_id) {
      throw new Error('Transaksi berhasil diproses tetapi nomor transaksi tidak diterima dari database.')
    }

    const { data, error } = await supabase
      .from('transactions')
      .select('*, transaction_items(*)')
      .eq('id', created.transaction_id)
      .single()

    if (error) {
      throw new Error(`Transaksi ${created.invoice_no} tercatat, tetapi rincian gagal dimuat: ${error.message}`)
    }

    const transaction = mapTransaction(data)
    transactions.value = [transaction, ...transactions.value.filter(item => item.id !== transaction.id)]
    return transaction
  }

  async function createCustomerOrder(payload) {
    const { data, error } = await supabase.rpc('create_customer_order', {
      p_items: payload.items.map(item => ({
        productId: item.productId,
        quantity: item.quantity
      })),
      p_notes: payload.notes || '',
      p_payment_method: payload.paymentMethod || 'cash_on_pickup'
    })

    if (error) throw new Error(`Pesanan gagal disimpan: ${error.message}`)

    const transaction = await fetchCreatedTransaction(data)
    try {
      await useProductStore().loadProducts()
    } catch (error) {
      transaction.refreshWarning = `Transaksi berhasil disimpan, tetapi stok terbaru gagal dimuat: ${error.message}`
    }
    return transaction
  }

  async function createPosTransaction(payload) {
    const { data, error } = await supabase.rpc('create_pos_transaction', {
      p_items: payload.items.map(item => ({
        productId: item.productId,
        quantity: item.quantity
      })),
      p_discount: Number(payload.discount || 0),
      p_payment_method: payload.paymentMethod || 'cash',
      p_payment_status: payload.paymentStatus || 'pending',
      p_cash_paid: Number(payload.cashPaid || 0),
      p_notes: payload.notes || '',
      p_customer_name: payload.customerName || 'Pelanggan Walk-in',
      p_customer_phone: payload.customerPhone === '-' ? '' : (payload.customerPhone || '')
    })

    if (error) throw new Error(`Transaksi gagal disimpan: ${error.message}`)

    const transaction = await fetchCreatedTransaction(data)
    try {
      await useProductStore().loadProducts()
    } catch (error) {
      transaction.refreshWarning = `Transaksi berhasil disimpan, tetapi stok terbaru gagal dimuat: ${error.message}`
    }
    return transaction
  }

  async function trackCustomerOrder(invoiceNo, phone) {
    const { data, error } = await supabase.rpc('lookup_customer_order', {
      p_invoice_no: invoiceNo.trim(),
      p_phone: phone.trim()
    })

    if (error) throw new Error(`Pencarian pesanan gagal: ${error.message}`)
    if (!data?.length) return null

    const order = data[0]
    return {
      id: order.id,
      invoiceNo: order.invoice_no,
      customerName: order.customer_name,
      createdAt: order.created_at,
      grandTotal: Number(order.grand_total),
      status: order.status,
      items: order.items || []
    }
  }

  async function updateStatus(id, newStatus) {
    if (!['processing', 'completed', 'cancelled'].includes(newStatus)) {
      throw new Error('Status transaksi tidak valid.')
    }
    const { data, error } = await supabase
      .from('transactions')
      .update({ status: newStatus })
      .eq('id', id)
      .select('id')
      .single()

    if (error) throw new Error(`Gagal memperbarui status pesanan: ${error.message}`)
    const transaction = transactions.value.find(item => item.id === data.id)
    if (transaction) transaction.status = newStatus
    return transaction || null
  }

  async function updatePaymentStatus(id, newStatus) {
    if (!['pending', 'paid'].includes(newStatus)) {
      throw new Error('Status pembayaran tidak valid.')
    }
    const { data, error } = await supabase
      .from('transactions')
      .update({ payment_status: newStatus })
      .eq('id', id)
      .select('id')
      .single()

    if (error) throw new Error(`Gagal memperbarui status pembayaran: ${error.message}`)
    const transaction = transactions.value.find(item => item.id === data.id)
    if (transaction) transaction.paymentStatus = newStatus
    return transaction || null
  }

  async function deleteTransaction(id) {
    const { error } = await supabase.from('transactions').delete().eq('id', id)
    if (error) throw new Error(`Gagal menghapus transaksi: ${error.message}`)
    const index = transactions.value.findIndex(transaction => transaction.id === id)
    return index === -1 ? null : transactions.value.splice(index, 1)[0]
  }

  return {
    transactions,
    isLoaded,
    loadError,
    allTransactions,
    totalOrders,
    totalRevenue,
    totalProfit,
    todayTransactions,
    todayRevenue,
    todayProfit,
    topSellingProducts,
    loadTransactions,
    getTransactionByIdOrInvoice,
    createCustomerOrder,
    createPosTransaction,
    trackCustomerOrder,
    updateStatus,
    updatePaymentStatus,
    deleteTransaction
  }
})
