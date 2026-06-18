# Controle Financeiro — Eduardo & Maitê

App de controle financeiro pessoal (entradas, saídas, histórico, separação Eduardo × Maitê e poupança da filha), **mobile-first** e com banco de dados no **Supabase**. Funciona também em modo local (sem configurar nada) salvando no próprio navegador.

## Estrutura

```
controle-financeiro/
├── index.html          # página principal
├── css/
│   └── styles.css      # estilo (mobile-first)
├── js/
│   ├── config.js       # ← cole aqui sua URL e anon key do Supabase
│   ├── db.js           # camada de dados (Supabase + fallback local)
│   └── app.js          # interface, gráficos e ações
├── db/
│   └── schema.sql      # tabelas do banco (rodar no Supabase)
└── README.md
```

## Passo 1 — Criar o banco no Supabase

1. Acesse [supabase.com](https://supabase.com) e crie um projeto (grátis).
2. No menu lateral, abra **SQL Editor → New query**.
3. Copie **todo** o conteúdo de `db/schema.sql`, cole e clique em **Run**.
   - Isso cria as tabelas `transactions`, `savings` e `settings`.

## Passo 2 — Conectar o app ao Supabase

1. No Supabase, vá em **Project Settings → API** (ou **Data API / API Keys**).
2. Copie:
   - **Project URL** (ex.: `https://xxxx.supabase.co`)
   - **anon public** key
3. Abra `js/config.js` e cole nos dois campos:
   ```js
   window.CASAVA_CONFIG = {
     SUPABASE_URL: "https://xxxx.supabase.co",
     SUPABASE_ANON_KEY: "eyJhbGciOiJI..."
   };
   ```
4. Abra o `index.html` no navegador. Se aparecer **“Supabase conectado”** no topo, está funcionando. Na primeira vez, o app já carrega os dados do período no banco.

> Se deixar `config.js` em branco, o app funciona em **modo local** (salva só naquele navegador).

## Passo 3 — Subir no GitHub e publicar

1. Crie um repositório e suba esta pasta (`Add file → Upload files`, ou via Git).
2. **Settings → Pages →** branch `main`, pasta `/ (root)` → **Save**.
3. Em ~1 minuto sai o link `https://seu-usuario.github.io/seu-repo/`.

## ⚠️ Segurança — leia antes de publicar

Este app não tem login. Com as políticas do `schema.sql`, **qualquer pessoa que tenha a URL do projeto + a anon key consegue ler e gravar** nas tabelas. Como a anon key fica no `config.js` (e, num repositório público, fica visível), escolha uma destas opções:

- **Mais simples:** mantenha o repositório **privado** (Settings → General → Danger Zone → Change visibility). O GitHub Pages continua funcionando.
- **Mais seguro:** adicione **Supabase Auth** (login por e-mail) e troque as políticas de RLS por regras com `auth.uid()`, para que só você veja seus dados. (Posso te ajudar a montar isso.)

São dados financeiros pessoais — vale tratar com cuidado.

## Recursos

- **Visão geral:** entradas, saídas, saldo, enviado p/ Maitê + gráficos.
- **Movimentações:** lançar/filtrar/apagar; histórico completo.
- **Maitê & Poupança:** separação dos gastos da filha + meta e depósitos de poupança.
- **Exportar:** botão no topo gera um backup `.json`.
