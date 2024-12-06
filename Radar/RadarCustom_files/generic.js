function validarCssLinkDarkMode() {
    const hrefDark = 'RadarCustom_files/dark.css';
    var darkmode = window.localStorage.getItem("darkMode");

    if (darkmode == undefined || darkmode == null || darkmode == '0') {
        const link = document.getElementById('darkcss');
        if (link)
            document.head.removeChild(link);
    }
    else {
        // Step 1: Create a new <link> element
        const link = document.createElement('link');

        link.id = 'darkcss';
        link.type = 'text/css';
        link.rel = 'stylesheet';
        link.href = hrefDark;

        document.head.appendChild(link);
    }
}

function validarElementsDarkMode() {
    var darkmode = window.localStorage.getItem("darkMode");

    if (darkmode == undefined || darkmode == null || darkmode == '0') {
        document.getElementById('toggle_dark_icon').classList.remove('fa-cloud-moon');
        document.getElementById('toggle_dark_icon').classList.add('fa-sun');
    }
    else {
        document.getElementById('toggle_dark_icon').classList.remove('fa-sun');
        document.getElementById('toggle_dark_icon').classList.add('fa-cloud-moon');
    }
}