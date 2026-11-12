import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getSupabaseClient } from '../lib/supabase'

function mapProduct(row) {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    costPrice: Number(row.cost_price),
    price: Number(row.price),
    stock: Number(row.stock),
    minStock: Number(row.min_stock),
    unit: row.unit,
    description: row.description,
    image: row.image,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

function toDatabaseProduct(product) {
  return {
    name: product.name.trim(),
    category: product.category || 'Classic',
    cost_price: Number(product.costPrice) || 0,
    price: Number(product.price) || 0,
    stock: Number(product.stock) || 0,
    min_stock: Number(product.minStock) || 10,
    unit: product.unit || 'pcs',
    description: product.description || '',
    image: product.image || '',
    is_active: product.isActive !== false
  }
}

export const useProductStore = defineStore('product', () => {
  const supabase = getSupabaseClient()
  const products = ref([])
  const isLoaded = ref(false)
  const loadError = ref('')

  const allProducts = computed(() => products.value)
  const activeProducts = computed(() => products.value.filter(product => product.isActive))
  const lowStockProducts = computed(() => products.value.filter(product => product.stock <= (product.minStock || 10)))
  const totalProducts = computed(() => products.value.length)
  const totalStock = computed(() => products.value.reduce((sum, product) => sum + Number(product.stock || 0), 0))
  const categories = computed(() => {
    const values = new Set(products.value.map(product => product.category))
    return ['Semua', ...Array.from(values)]
  })

  async function loadProducts() {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: true })

    if (error) {
      loadError.value = error.message
      throw new Error(`Gagal memuat katalog Supabase: ${error.message}`)
    }

    products.value = data.map(mapProduct)
    isLoaded.value = true
    loadError.value = ''
    return products.value
  }

  function getProductById(id) {
    return products.value.find(product => product.id === id)
  }

  async function addProduct(productData) {
    const id = `PRD-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const { data, error } = await supabase
      .from('products')
      .insert({ id, ...toDatabaseProduct(productData) })
      .select()
      .single()

    if (error) throw new Error(`Gagal menambahkan produk: ${error.message}`)
    const product = mapProduct(data)
    products.value.unshift(product)
    return product
  }

  async function updateProduct(id, updatedData) {
    const { data, error } = await supabase
      .from('products')
      .update(toDatabaseProduct(updatedData))
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(`Gagal memperbarui produk: ${error.message}`)
    const updatedProduct = mapProduct(data)
    const index = products.value.findIndex(product => product.id === id)
    if (index !== -1) products.value[index] = updatedProduct
    return updatedProduct
  }

  async function deleteProduct(id) {
    const { error } = await supabase.from('products').delete().eq('id', id)
    if (error) throw new Error(`Gagal menghapus produk: ${error.message}`)

    const index = products.value.findIndex(product => product.id === id)
    return index === -1 ? null : products.value.splice(index, 1)[0]
  }

  async function resetToDefault() {
    return loadProducts()
  }

  return {
    products,
    isLoaded,
    loadError,
    allProducts,
    activeProducts,
    lowStockProducts,
    totalProducts,
    totalStock,
    categories,
    getProductById,
    loadProducts,
    addProduct,
    updateProduct,
    deleteProduct,
    resetToDefault
  }
})
