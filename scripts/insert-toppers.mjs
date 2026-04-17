import { execSync } from 'child_process';

const BASE_URL = 'https://api.leiasabores.pt/api/images';
const R2_PATH = 'products/toppers';

const products = [
  // já inserido: topper-heineken-boteco (id 14) - vamos re-inserir a imagem só
  { slug: 'topper-heineken-boteco',      title: 'Topper Heineken / Boteco',        cat: 7, featured: 1, file: 'topper-heineken-boteco.jpeg',      desc: 'Topper personalizado tema Heineken e Boteco. Inclui garrafinhas, copos e plaquinhas divertidas. Perfeito para festas adultas.' },
  { slug: 'topper-lilo-stitch',          title: 'Topper Lilo & Stitch',            cat: 7, featured: 1, file: 'topper-lilo-stitch.jpeg',           desc: 'Topper tema Lilo e Stitch com personagens coloridos e decoracao tropical. Ideal para aniversarios infantis.' },
  { slug: 'topper-patrulha-pata',        title: 'Topper Patrulha Pata',            cat: 7, featured: 1, file: 'topper-patrulha-pata.jpeg',         desc: 'Topper Patrulha Pata com Chase, Marshall e Ryder. Kit completo para decorar o bolo da festa.' },
  { slug: 'topper-minnie-rosa',          title: 'Topper Minnie Mouse Rosa',        cat: 7, featured: 1, file: 'topper-minnie-rosa.jpeg',           desc: 'Topper Minnie Mouse em tons de rosa com casinha, baloes e numero. Encantador para festinhas de meninas.' },
  { slug: 'topper-homem-aranha',         title: 'Topper Homem-Aranha',             cat: 7, featured: 0, file: 'topper-homem-aranha.jpeg',          desc: 'Topper Homem-Aranha com skyline da cidade, efeitos POW e BAM. O preferido dos pequenos super-herois.' },
  { slug: 'topper-futebol-feminino',     title: 'Topper Futebol Feminino',         cat: 7, featured: 0, file: 'topper-futebol-feminino.jpeg',      desc: 'Topper futebol feminino com silhueta, chuteira e trofeu em tons de rosa. Para a craque da familia!' },
  { slug: 'topper-dj-musica',            title: 'Topper DJ / Musica',              cat: 7, featured: 0, file: 'topper-dj-musica.jpeg',             desc: 'Topper tema DJ com toca-discos, colunas, vinis e fones. Ideal para festas de musica e DJs apaixonados.' },
  { slug: 'topper-nome-acrilico',        title: 'Topper Nome em Acrilico',         cat: 7, featured: 0, file: 'topper-nome-acrilico.jpeg',         desc: 'Topper personalizado com nome em acrilico espelhado. Elegante e moderno para qualquer tema de festa.' },
  { slug: 'topper-homem-aranha-2',       title: 'Topper Homem-Aranha Classic',     cat: 7, featured: 0, file: 'topper-homem-aranha-2.jpeg',        desc: 'Topper Homem-Aranha versao classica com teia e simbolo da aranha. Kit completo para o bolo.' },
  { slug: 'topper-baby-shark',           title: 'Topper Baby Shark',               cat: 7, featured: 1, file: 'topper-baby-shark.jpeg',            desc: 'Topper Baby Shark com toda a familia de tubaraos, conchas e bolhas do mar. Para os fas do Doo Doo Doo!' },
  { slug: 'topper-real-madrid',          title: 'Topper Real Madrid',              cat: 7, featured: 0, file: 'topper-real-madrid.jpeg',           desc: 'Topper Real Madrid com escudo, bola e jogador. Para os adeptos merengues de todas as idades.' },
  { slug: 'topper-costura',              title: 'Topper Costura / Alfaiataria',    cat: 7, featured: 0, file: 'topper-costura.jpeg',               desc: 'Topper tema costura com maquina de costura, linhas, tesoura e manequim. Homenagem para quem ama a moda.' },
  { slug: 'topper-maquiagem-glam',       title: 'Topper Maquiagem Glam',           cat: 7, featured: 0, file: 'topper-maquiagem-glam.jpeg',        desc: 'Topper maquiagem glam com batom, pincel, bolsa e salto alto dourado. Para as fashionistas da festa.' },
  { slug: 'topper-flamengo',             title: 'Topper Flamengo',                 cat: 7, featured: 1, file: 'topper-flamengo.jpeg',              desc: 'Topper Flamengo com escudo CRF, trofeu, mascote e numero personalizado. Mengo!' },
  { slug: 'topper-stitch-azul',          title: 'Topper Stitch Azul',              cat: 7, featured: 0, file: 'topper-stitch-azul.jpeg',           desc: 'Topper Stitch em tons de azul com coracoes e nome personalizado. Fofura garantida para qualquer festa.' },
  { slug: 'topper-vingadores',           title: 'Topper Vingadores',               cat: 7, featured: 1, file: 'topper-vingadores.jpeg',            desc: 'Topper Vingadores com Thor, Homem-Aranha, Homem de Ferro, Capitao America e Hulk. Para os fas da Marvel.' },
  { slug: 'topper-masha-urso',           title: 'Topper Masha e o Urso',           cat: 7, featured: 0, file: 'topper-masha-urso.jpeg',            desc: 'Topper Masha e o Urso com casa na arvore, personagens e cenario completo. Perfeito para os pequeninos.' },
  { slug: 'topper-nome-dourado',         title: 'Topper Nome em Dourado',          cat: 7, featured: 0, file: 'topper-nome-dourado.jpeg',          desc: 'Topper simples e elegante com nome em dourado. Combina com qualquer estilo de bolo.' },
  { slug: 'topper-fortnite-feminino',    title: 'Topper Fortnite Feminino',        cat: 7, featured: 0, file: 'topper-fortnite-feminino.jpeg',     desc: 'Topper Fortnite Battle Royale versao feminina com personagens e lhama colorida. Para as gamers!' },
  { slug: 'topper-minecraft',            title: 'Topper Minecraft',                cat: 7, featured: 1, file: 'topper-minecraft.jpeg',             desc: 'Topper Minecraft com Steve, Alex, Creeper e personagens pixelados. Para os construtores de mundos!' },
  { slug: 'topper-carros-mcqueen',       title: 'Topper Carros Lightning McQueen', cat: 7, featured: 1, file: 'topper-carros-mcqueen.jpeg',        desc: 'Topper Carros com Lightning McQueen, semaforo e bandeiras. Ka-chow para a festa do seu piloto!' },
  { slug: 'topper-praia-tardezinha',     title: 'Topper Praia / Tardezinha',       cat: 7, featured: 0, file: 'topper-praia-tardezinha.jpeg',      desc: 'Topper tema praia com palmeiras, cadeira de praia, chinelo e por do sol. Para uma Tardezinha inesquecivel.' },
  { slug: 'topper-cafe',                 title: 'Topper Cafe',                     cat: 7, featured: 0, file: 'topper-cafe.jpeg',                  desc: 'Topper I Love Cafe com xícaras, graos e frases divertidas. Para quem nao abre mao do cafezinho!' },
  { slug: 'topper-parabens-prata',       title: 'Topper Parabens Prata',           cat: 7, featured: 0, file: 'topper-parabens-prata.jpeg',        desc: 'Topper Parabens elegante em acrilico espelhado prata com borboletas e moldura geometrica.' },
  { slug: 'topper-minnie-vermelha',      title: 'Topper Minnie Mouse Vermelha',    cat: 7, featured: 0, file: 'topper-minnie-vermelha.jpeg',       desc: 'Topper Minnie Mouse classica em vermelho e branco. Com laco iconico e personagens animados.' },
  { slug: 'topper-minnie-rosa-2',        title: 'Topper Minnie Mouse Rosa 2',      cat: 7, featured: 0, file: 'topper-minnie-rosa-2.jpeg',         desc: 'Topper Minnie Mouse em rosa intenso com casinha e baloes. Versao extra encantadora para as princesas.' },
  { slug: 'topper-fortnite-masculino',   title: 'Topper Fortnite Masculino',       cat: 7, featured: 0, file: 'topper-fortnite-masculino.jpeg',    desc: 'Topper Fortnite Battle Royale masculino com personagens e logo. Para os gamers de plantao!' },
  { slug: 'topper-gin-beefeater',        title: 'Topper Gin Beefeater',            cat: 7, featured: 0, file: 'topper-gin-beefeater.jpeg',         desc: 'Topper Gin Beefeater com garrafa, copo e morango. Para celebrar com estilo os apreciadores de gin.' },
  { slug: 'topper-academia-fitness',     title: 'Topper Academia / Fitness',       cat: 7, featured: 0, file: 'topper-academia-fitness.jpeg',      desc: 'Topper academia com silhuetas de crossfit, pesos e halteres em acrilico negro. Para os atletas!' },
  { slug: 'topper-stitch-angel',         title: 'Topper Stitch e Angel',           cat: 7, featured: 0, file: 'topper-stitch-angel.jpeg',          desc: 'Topper Stitch e Angel juntos, com coracoes e flores. Para os fas do casal mais fofo da Disney.' },
  { slug: 'topper-vaquinha',             title: 'Topper Vaquinha',                 cat: 7, featured: 0, file: 'topper-vaquinha.jpeg',              desc: 'Topper vaquinha fofa em 3D sobre bolo branco com pintas. Charme total para festas de cha ou aniversario.' },
  { slug: 'topper-moana-baby',           title: 'Topper Moana Baby',               cat: 7, featured: 0, file: 'topper-moana-baby.jpeg',            desc: 'Topper Moana Baby com cena de praia, conchas, flores e o galo Hei Hei. Para as filhinhas do oceano.' },
  { slug: 'topper-musica-vinil',         title: 'Topper Musica / Vinil',           cat: 7, featured: 0, file: 'topper-musica-vinil.jpeg',          desc: 'Topper musica com discos de vinil, notas musicais e I Love 80s. Para os amantes da boa musica.' },
  { slug: 'topper-pesca',                title: 'Topper Pesca',                    cat: 7, featured: 0, file: 'topper-pesca.jpeg',                 desc: 'Topper pesca com pescador, cana, balde de peixe. Para os pescadores!' },
  { slug: 'topper-ariel-sereia',         title: 'Topper Ariel Pequena Sereia',     cat: 7, featured: 1, file: 'topper-ariel-sereia.jpeg',          desc: 'Topper Ariel Pequena Sereia com conchas, cavalinho-marinho e cauda de sereia. Para as princesas do mar.' },
  { slug: 'topper-maquiagem-rosa',       title: 'Topper Maquiagem Rosa',           cat: 7, featured: 0, file: 'topper-maquiagem-rosa.jpeg',        desc: 'Topper maquiagem em rosa com paleta de sombras, batom e bolsa. Para as fashionistas do bolo!' },
  { slug: 'topper-barbie',               title: 'Topper Barbie',                   cat: 7, featured: 1, file: 'topper-barbie.jpeg',                desc: 'Topper Barbie com rosto iconico e silhueta dourada. Rosa, glamouroso e inconfundivel.' },
  { slug: 'topper-naruto',               title: 'Topper Naruto',                   cat: 7, featured: 0, file: 'topper-naruto.jpeg',                desc: 'Topper Naruto com o ninja de Konoha em posicao de batalha e logo. Para os fas do anime!' },
  { slug: 'gel-azul-royal',              title: 'Gel Azul Royal',                  cat: 8, featured: 1, file: 'gel-azul-royal.jpeg',               desc: 'Gel corante Azul Royal em pasta para colorir massas, cremes e coberturas. Cor intensa, altamente concentrado.', price: 350 },
];

function run(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
  } catch(e) {
    return e.stdout + e.stderr;
  }
}

function sqlEscape(str) {
  return str.replace(/'/g, "''");
}

console.log('🚀 Iniciando inserção de produtos...\n');

// Skip the first one already inserted (topper-heineken-boteco), just add its image
// First check what already exists
const existing = run(`npx wrangler d1 execute loja-mae-db --remote --command="SELECT slug, id FROM products WHERE slug LIKE 'topper-%' OR slug LIKE 'gel-%' ORDER BY id"`);
console.log('Produtos existentes:', existing.match(/"slug": "[^"]+"/g)?.join(', ') || 'nenhum');

for (const p of products) {
  const price = p.price || 590;
  const imageUrl = `https://api.leiasabores.pt/api/images/${R2_PATH}/${p.file}`;
  const imageKey = `${R2_PATH}/${p.file}`;

  // Check if already exists
  const checkResult = run(`npx wrangler d1 execute loja-mae-db --remote --command="SELECT id FROM products WHERE slug='${p.slug}' LIMIT 1"`);
  const existingId = checkResult.match(/"id": (\d+)/)?.[1];

  let productId;

  if (existingId) {
    productId = existingId;
    console.log(`⏭️  ${p.title} já existe (id=${productId}), actualizando imagem...`);
    // Update title with proper accents
    run(`npx wrangler d1 execute loja-mae-db --remote --command="UPDATE products SET title='${sqlEscape(p.title)}', featured=${p.featured} WHERE id=${productId}"`);
  } else {
    const insertResult = run(`npx wrangler d1 execute loja-mae-db --remote --command="INSERT INTO products (title, slug, description, price_cents, status, category_id, stock_quantity, featured) VALUES ('${sqlEscape(p.title)}', '${p.slug}', '${sqlEscape(p.desc)}', ${price}, 'active', ${p.cat}, 50, ${p.featured}) RETURNING id"`);
    productId = insertResult.match(/"id": (\d+)/)?.[1];
    if (!productId) {
      // fallback: get by slug
      const getResult = run(`npx wrangler d1 execute loja-mae-db --remote --command="SELECT id FROM products WHERE slug='${p.slug}' LIMIT 1"`);
      productId = getResult.match(/"id": (\d+)/)?.[1];
    }
    console.log(`✅ Inserido: ${p.title} (id=${productId})`);
  }

  if (productId) {
    // Insert image if not exists
    const imgCheck = run(`npx wrangler d1 execute loja-mae-db --remote --command="SELECT id FROM product_images WHERE product_id=${productId} LIMIT 1"`);
    const imgExists = imgCheck.match(/"id": \d+/);
    if (!imgExists) {
      run(`npx wrangler d1 execute loja-mae-db --remote --command="INSERT INTO product_images (product_id, image_url, image_key, alt_text, position, is_primary) VALUES (${productId}, '${imageUrl}', '${imageKey}', '${sqlEscape(p.title)}', 0, 1)"`);
      console.log(`   📸 Imagem adicionada: ${p.file}`);
    }
  }
}

console.log('\n✅ Todos os produtos inseridos com sucesso!');
