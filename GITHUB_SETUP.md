# 🚀 Setup GitHub - Loja Mãe

## ✅ Status Atual

- ✅ Git inicializado
- ✅ Código commitado (4 commits)
- ✅ GitHub Actions workflows configurados
- ✅ .gitignore configurado (secrets protegidos)
- ⏭️ Pronto para push no GitHub

## 🚀 Opção 1: Script Automatizado (Mais Fácil)

Execute:

```bash
bash scripts/setup-github.sh
```

O script irá guiá-lo através do processo.

## 📝 Opção 2: Manual

### Passo 1: Criar Repositório no GitHub

1. Acesse: https://github.com/new
2. **Nome do repositório**: `loja-mae`
3. **Descrição** (opcional): "E-commerce completo full stack com Cloudflare Workers"
4. **Visibilidade**: Público ou Privado
5. **⚠️ IMPORTANTE**: NÃO marque "Add a README file", "Add .gitignore" ou "Choose a license"
6. Clique em **"Create repository"**

### Passo 2: Adicionar Remote

```bash
# Substitua SEU-USUARIO pelo seu usuário GitHub
git remote add origin https://github.com/SEU-USUARIO/loja-mae.git
```

### Passo 3: Fazer Push

```bash
git push -u origin main
```

Se pedir credenciais:
- **Username**: Seu usuário GitHub
- **Password**: Use um Personal Access Token (não sua senha)
  - Criar token: https://github.com/settings/tokens
  - Permissões: `repo` (acesso completo aos repositórios)

### Passo 4: Verificar

Acesse: https://github.com/SEU-USUARIO/loja-mae

Você deve ver todos os arquivos do projeto.

## 🔐 Configurar Secrets para CI/CD (Opcional)

Para habilitar deploy automático via GitHub Actions:

### 1. Obter Account ID do Cloudflare

```bash
npx wrangler whoami
```

Ou no dashboard: https://dash.cloudflare.com/ → Settings → Account ID

### 2. Adicionar Secrets no GitHub

1. Acesse: https://github.com/SEU-USUARIO/loja-mae/settings/secrets/actions
2. Clique em "New repository secret"
3. Adicione:

   **Secret 1:**
   - Name: `CLOUDFLARE_API_TOKEN`
   - Value: Seu token API do Cloudflare
     - Criar em: https://dash.cloudflare.com/profile/api-tokens
     - Permissões: Account → Workers Scripts → Edit

   **Secret 2:**
   - Name: `CLOUDFLARE_ACCOUNT_ID`
   - Value: Seu Account ID do Cloudflare

### 3. Verificar Deploy Automático

Após fazer push, o GitHub Actions irá:
- Executar automaticamente em cada push para `main`
- Fazer deploy do backend para Cloudflare Workers
- Você pode ver o progresso em: Actions → Workflow runs

## 📋 Comandos Úteis

### Ver status:
```bash
git status
```

### Ver commits:
```bash
git log --oneline
```

### Ver remote:
```bash
git remote -v
```

### Fazer push de novas alterações:
```bash
git add .
git commit -m "Descrição das alterações"
git push
```

### Atualizar código local:
```bash
git pull origin main
```

## 🆘 Troubleshooting

### Erro: "remote origin already exists"
```bash
git remote remove origin
git remote add origin https://github.com/SEU-USUARIO/loja-mae.git
```

### Erro: "Authentication failed"
- Use um Personal Access Token em vez da senha
- Criar token: https://github.com/settings/tokens
- Permissão: `repo`

### Erro: "Repository not found"
- Verifique se o repositório existe no GitHub
- Verifique se você tem permissão de escrita
- Verifique se o nome do usuário está correto

### Erro no GitHub Actions
- Verifique se os secrets estão configurados
- Verifique os logs em: Actions → Workflow run
- Verifique se o token API tem as permissões corretas

## 📚 Próximos Passos

Após fazer push:

1. ✅ Código no GitHub
2. ⏭️ Configurar secrets (para CI/CD)
3. ⏭️ Fazer deploy do backend (manual ou automático)
4. ⏭️ Deploy do frontend (Vercel/Netlify)
5. ⏭️ Configurar domínio customizado

## 🔗 Links Úteis

- GitHub: https://github.com
- Criar repositório: https://github.com/new
- Personal Access Tokens: https://github.com/settings/tokens
- Cloudflare API Tokens: https://dash.cloudflare.com/profile/api-tokens

---

**Status**: ✅ Pronto para push
**Próximo passo**: Criar repositório no GitHub e fazer push

