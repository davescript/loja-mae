/**
 * Script Node.js para adicionar produto de exemplo via API
 * 
 * Uso:
 *   node scripts/adicionar-produto-exemplo.js
 * 
 * Ou com variáveis de ambiente:
 *   API_URL=https://loja-mae-api.davecdl.workers.dev \
 *   ADMIN_EMAIL=admin@loja-mae.com \
 *   ADMIN_PASSWORD=admin123 \
 *   node scripts/adicionar-produto-exemplo.js
 */

const API_URL = process.env.API_URL || 'https://loja-mae-api.davecdl.workers.dev';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@loja-mae.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

async function adicionarProdutoExemplo() {
  try {
    console.log('🔐 Fazendo login como admin...');
    
    // 1. Login
    const loginResponse = await fetch(`${API_URL}/api/auth/admin/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
      }),
    });

    if (!loginResponse.ok) {
      const error = await loginResponse.json();
      throw new Error(`Erro no login: ${error.error || loginResponse.statusText}`);
    }

    const loginData = await loginResponse.json();
    const token = loginData.data?.token;

    if (!token) {
      throw new Error('Token não recebido no login');
    }

    console.log('✅ Login realizado com sucesso!\n');

    // 2. Criar produto
    console.log('📦 Criando produto de exemplo...\n');

    const formData = new FormData();
    formData.append('title', 'Produto Exemplo via Script');
    formData.append('description', 'Este é um produto de exemplo criado via script Node.js. Ele demonstra como adicionar produtos via API.');
    formData.append('short_description', 'Produto exemplo criado via script');
    formData.append('price_cents', '19990'); // R$ 199,90
    formData.append('compare_at_price_cents', '24990'); // R$ 249,90
    formData.append('sku', 'EXEMP-SCRIPT-001');
    formData.append('stock_quantity', '30');
    formData.append('status', 'active');
    formData.append('featured', '1');
    formData.append('category_id', '1'); // Eletrônicos
    formData.append('meta_title', 'Produto Exemplo - Loja Mãe');
    formData.append('meta_description', 'Produto de exemplo criado via script para demonstração');

    // Nota: Para adicionar imagens, você precisaria de arquivos reais
    // Exemplo:
    // const imageBuffer = await fs.readFile('./imagem.jpg');
    // const imageBlob = new Blob([imageBuffer], { type: 'image/jpeg' });
    // formData.append('images', imageBlob, 'imagem.jpg');
    // formData.append('image_alt_0', 'Imagem principal do produto');

    const productResponse = await fetch(`${API_URL}/api/products`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!productResponse.ok) {
      const error = await productResponse.json();
      throw new Error(`Erro ao criar produto: ${error.error || productResponse.statusText}`);
    }

    const productData = await productResponse.json();
    
    console.log('✅ Produto criado com sucesso!\n');
    console.log('📋 Detalhes do produto:');
    console.log(JSON.stringify(productData, null, 2));

    // 3. Buscar produto criado (com imagens e variantes)
    if (productData.data?.id) {
      console.log('\n🔍 Buscando produto completo...\n');
      
      const getResponse = await fetch(
        `${API_URL}/api/products/${productData.data.id}?include=all`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (getResponse.ok) {
        const fullProduct = await getResponse.json();
        console.log('📦 Produto completo (com imagens e variantes):');
        console.log(JSON.stringify(fullProduct, null, 2));
      }
    }

    console.log('\n✅ Script concluído com sucesso!');
    console.log(`\n📝 Para ver o produto: ${API_URL}/api/products/${productData.data?.id}?include=all`);

  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  adicionarProdutoExemplo();
}

module.exports = { adicionarProdutoExemplo };

