(function () {
    function executar() {
        const pagina = location.pathname.split('/').pop() || 'index.html';
        if (pagina === 'login.html' || pagina === '') return;
        if (!window.ALLSync) return;
        if (!window.ALLSync.info().configurado) return;

        window.ALLSync.usuarioAtual().then(sessao => {
            if (!sessao) location.href = 'login.html';
        }).catch(() => location.href = 'login.html');
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', executar);
    else executar();
})();
