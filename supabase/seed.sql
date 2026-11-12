insert into public.products (
  id, name, category, cost_price, price, stock, min_stock, unit, description, image, is_active
) values
  (
    'PRD-001', 'Donat Coklat Meses', 'Classic', 3500, 7500, 38, 15, 'pcs',
    'Donat lembut dengan lapisan cokelat manis dan taburan meses.',
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRJEUHacFadI0doARTwJkH3IQwSIpOlMPysuBPGCIMZdg&s=10',
    true
  ),
  (
    'PRD-002', 'Donat Kacang Nougat', 'Classic', 4000, 8500, 30, 15, 'pcs',
    'Donat lembut dengan taburan kacang nougat yang renyah.',
    'https://th.bing.com/th/id/OIP.EczbSNDc0rdnxTOvadTj6wHaEJ?w=282&h=180&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3',
    true
  ),
  (
    'PRD-003', 'Donat Gula salju', 'Classic', 3000, 6000, 45, 15, 'pcs',
    'Donat kentang empuk dengan taburan gula salju yang manis.',
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQHDqxHzKyPq8p0a3jIm9nD989am6eO0lKSVYNlETW9Lw&s=10',
    true
  ),
  (
    'PRD-004', 'Donat Tiramisu', 'Premium', 5000, 10000, 25, 10, 'pcs',
    'Donat dengan topping tiramisu lembut bercita rasa kopi dan cokelat.',
    'https://th.bing.com/th/id/OIP.eJ1Yx5zKNUCYzpmU2mlf_wHaHa?w=173&h=180&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3',
    true
  ),
  (
    'PRD-005', 'Donat Chocolate Rainbow Sprinkles', 'Premium', 4000, 8500, 30, 10, 'pcs',
    'Donat berlapis cokelat dengan taburan sprinkle warna-warni.',
    'https://thumbs.dreamstime.com/b/chocolate-glazed-donut-rainbow-sprinkles-384143736.jpg',
    true
  )
on conflict (id) do nothing;
