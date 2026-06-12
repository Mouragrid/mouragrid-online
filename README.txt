Mouragrid - Controle de Horas Online

Esta versão foi preparada para usar:
- Vercel para hospedar a tela do aplicativo.
- Supabase para guardar clientes, contatos, contratos e atendimentos.

Passo 1 - Criar o banco no Supabase
1. Acesse https://supabase.com e crie um projeto gratuito.
2. No painel do projeto, abra SQL Editor.
3. Copie o conteúdo do arquivo supabase-schema.sql.
4. Cole no SQL Editor e execute.

Passo 2 - Configurar o app
1. No Supabase, abra Project Settings > API.
2. Copie a Project URL.
3. Copie a chave anon public.
4. Abra public/supabase-config.js.
5. Substitua:
   COLE_AQUI_A_URL_DO_SUPABASE
   COLE_AQUI_A_CHAVE_ANON_PUBLIC_DO_SUPABASE

Passo 3 - Publicar na Vercel
1. Acesse https://vercel.com e crie uma conta gratuita.
2. Crie um novo projeto usando esta pasta.
3. Se a Vercel perguntar o framework, escolha Other.
4. Configure a pasta de saída como public, se essa opção aparecer.
5. Publique.

Depois de publicado, todos que acessarem o mesmo link usarão a mesma base do Supabase.

Observação de segurança:
Esta versão usa a chave pública do Supabase e políticas abertas para simplificar o primeiro uso. Para operação com dados reais de clientes, o próximo passo recomendado é adicionar login por usuário ou proteger escrita com regras mais restritas.
