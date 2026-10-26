var style = document.createElement('style');
style.type = 'text/css';
style.innerHTML = '%s';
document.head.appendChild(style);

window.onload = function () {
    if (document.getElementById("hsk-web-free-loading-continue-visit")) {
        location.reload();
    }
}