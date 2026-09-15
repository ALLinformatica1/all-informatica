ALL INFORMÁTICA — ETAPA 2: BANCO ONLINE

Esta versão usa o Supabase para compartilhar PRODUTOS, VENDAS e ORDENS DE SERVIÇO entre computador, notebook, celular e tablet.

O arquivo supabase-config.js já está configurado com a URL e a chave PUBLICÁVEL fornecidas para este projeto.

IMPORTANTE:
- Nunca coloque uma service_role ou sb_secret no navegador.
- O sistema mantém localStorage como modo offline.
- Depois do login, se houver dados na nuvem, eles são carregados automaticamente.
- Se a nuvem estiver vazia, os dados locais são preservados para permitir o primeiro envio.
- Depois que um produto, venda ou OS é salvo com um usuário conectado, a alteração é enviada automaticamente para a nuvem.

BANCO:
- Execute supabase-schema.sql no SQL Editor do Supabase uma vez.
- As tabelas são all_produtos, all_vendas e all_ordens_servico.

PRIMEIRO USO:
1. Abra login.html.
2. Crie seu acesso.
3. Entre no sistema.
4. Cadastre um produto de teste.
5. Abra o Supabase > Table Editor e confira a tabela all_produtos.
6. Se estiver correto, cadastre os demais produtos.

MIGRAÇÃO DE DADOS LOCAIS:
- Se um aparelho já tiver dados locais, abra sync.html e use "Enviar este aparelho para a nuvem".
- Não use "Baixar da nuvem" em um aparelho que tenha dados locais importantes sem conferir antes, pois essa opção substitui os dados locais pelos dados da nuvem.

MULTIPLATAFORMA:
- Todos os aparelhos devem acessar a mesma versão hospedada do sistema.
- Faça login com o mesmo usuário.
- Ao abrir uma página, os dados da nuvem são carregados.
- Alterações salvas em um aparelho são enviadas para o banco online.

OBSERVAÇÃO:
- Esta etapa ainda usa operações de lista completa para produtos/vendas/OS. Em uma operação com vários funcionários, a próxima evolução recomendada é usar operações transacionais no banco para impedir conflitos de estoque quando duas vendas ocorrerem simultaneamente.
