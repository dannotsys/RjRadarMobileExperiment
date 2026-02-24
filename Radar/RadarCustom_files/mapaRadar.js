$(document).ready(function () {
    validarElementsDarkMode();
    //
    //var layerOSM = L.tileLayer('https://mt.google.com/vt/lyrs=r&f=q&x={x}&y={y}&z={z}&s=Gal&apistyle=s.t%3A3|s.e%3Ag|p.v%3Aoff,s.t%3A3|s.e%3Al|p.v%3Aoff,s.t%3A2|s.e%3Al|p.v%3Aoff', {
    var layerOSM = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png?', {
        attribution: '',
        minZoom: 3,
        maxZoom: 16,
    });

    let defaultZoom = 7;

    if (window.matchMedia("(min-width:1024px)").matches) {
        defaultZoom = 9;
    }

    var mymap = L.map('mapid',
        {
            zoomControl: false,
            layers: [layerOSM,],
        }
    ).setView([-22.8499, -43.2399], defaultZoom);

    //Plota o controle de zoom canto inferior direito
    L.control.zoom().setPosition('bottomright').addTo(mymap)

    // Bounds das imagens do radar (suposto ajuste de área coberta...)
    //var bounds = L.latLngBounds(
    //    L.latLng(-23.915567, -44.63129),
    //    L.latLng(-21.974793, -41.813774)
    //)

    // Bounds das imagens do radar
    var bounds = L.latLngBounds(
        L.latLng(-24.431567, -45.376972),
        L.latLng(-21.478793, -41.129092)
    )

    //Desenha o circulo do alcançe do radar meteorológico
    L.circle([-22.959849, -43.2726667],
        {
            radius: 141200,
            weight: 3,
            dashArray: '10 10',
            color: '#00F',
            fill: false,
        }).addTo(mymap);

    var intervalo_radar = null;
    var imagem_atual = 1;
    var immagem_maxima = 20;
    var ultima_imagem_carregada = 0;
    var play = true;
    var radar = null;
    var baseUrl = 'https://bpyu1frhri.execute-api.us-east-1.amazonaws.com/maparadar/radar';
    var parametrosUrl = '';
    var query = Math.random();
    
    var imageLoading = $('#image_loading');
    var imageLoadingPanel = $('#loadingdiv');
    var apisources = $('#apisources');
    var infoJson = document.getElementById('infoJson');
    var canvasTime = document.getElementById('canvas_timestamp');
    var canvasTimeCtx = canvasTime.getContext("2d");
    var canvasTimeCtxCropping = {
        x: 0,
        y: 0,
        width: 312,
        height: 26
    };
    canvasTime.width = canvasTimeCtxCropping.width * 2;
    canvasTime.height = canvasTimeCtxCropping.height * 2;

    var selectedApiSource = window.localStorage.getItem("selectedApiSource");
    if (selectedApiSource == undefined || selectedApiSource == null) {
        selectedApiSource = "4";
    }

    mudar_origem_dados(selectedApiSource);
    apisources.val(selectedApiSource);

    apisources.on('change', function () {
        let source = this.value;
        mudar_origem_dados(source);
        if (play)
            atualizar();
    })

    $('#play_pause').click(function () {
        play_pause();
    })

    $('#backward').click(function () {
        imagem_anterior();
    })

    $('#forward').click(function () {
        proxima_imagem();
    })

    $('#reload').click(function () {
        atualizar();
    })

    $('#toogle_dark').click(function () {
        let darkmode = window.localStorage.getItem("darkMode");

        if (darkmode == undefined || darkmode == null || darkmode == '0') {
            darkmode = '1';
        }
        else {
            darkmode = '0';
        }

        localStorage.setItem("darkMode", darkmode);

        validarCssLinkDarkMode();
        validarElementsDarkMode();
    })

    //  de controle das imagens
    function mudar_origem_dados(source) {
        
        if (source !== undefined) {
            selectedApiSource = source;

            localStorage.setItem("selectedApiSource", source);

            if (source == "1") {
                baseUrl = 'https://imagens.climatempo.com.br/georio/radar/radar';
                parametrosUrl = '';
                immagem_maxima = 10;
            }
            else if (source == "2") {
                baseUrl = 'https://bpyu1frhri.execute-api.us-east-1.amazonaws.com/maparadar/radar';
                parametrosUrl = '';
                immagem_maxima = 20;
            }
            else if (source == "3") {
                baseUrl = 'https://alertario.rio.rj.gov.br/upload/Mapa/semfundo/radar';
                parametrosUrl = '';
                immagem_maxima = 20;
            }
            else {
                baseUrl = 'https://www.sistema-alerta-rio.com.br/upload/Mapa/semfundo/radar';
                parametrosUrl = ''
                immagem_maxima = 20;
            }
            ultima_imagem_carregada = 0;
            imagem_atual = 1;
        }
    }

    function ligar_intervalo_radar() {
        mostrar_imagem();
        intervalo_radar = window.setInterval(function () {
            proxima_imagem();
        }, 1000);
    }
	
	function flipOverlayVertically(img) {
	    img.style.transform += ' scaleY(-1)';
	}
	
    function play_pause() {
        if (play) {
            ligar_intervalo_radar();
            play = false;
            $('#play_pause_icon').removeClass('fas fa-play');
            $('#play_pause_icon').addClass('fas fa-pause');
        } else {
            if (intervalo_radar != null) {
                clearInterval(intervalo_radar);
            }
            play = true;
            $('#play_pause_icon').removeClass('fas fa-pause');
            $('#play_pause_icon').addClass('fas fa-play');
        }
    }

    function proxima_imagem() {
        if (imagem_atual < immagem_maxima) {
            imagem_atual += 1;
        } else {
            imagem_atual = 1;
        }
        ultima_imagem_carregada = 0;
        mostrar_imagem();
    }

    function imagem_anterior() {
        if (imagem_atual > 1) {
            imagem_atual -= 1;
        } else {
            imagem_atual = immagem_maxima;
        }
        ultima_imagem_carregada = 0;
        mostrar_imagem();
    }

    function get_url(imagem)
    {
        let url = baseUrl + (
            String('000' + imagem).slice(-3)
        ) + '.png?query=' + query;

        url = url + parametrosUrl;

        return url;
    }

    function mostrar_imagem() {
        let img = new Image();
        if (selectedApiSource == "2") {
            img.setAttribute('crossorigin', 'anonymous');
        }
        img.classList = 'timestamp';
        img.title = 'Data e horário';

        let hanging = setTimeout(isHanging, 250);

        img.onload = function () {
            clearTimeout(hanging);
            carregar_imagem(img);
        };
        let url = get_url(imagem_atual);

        img.src = url;
    }

    function isHanging() {
        if (imageLoadingPanel.is(":hidden")) {
            imageLoading.removeClass('easeload');
            imageLoading.css('opacity', '0');
            imageLoading.show();
            imageLoading.addClass('easeload');
            imageLoading.css('opacity', '1');
            imageLoadingPanel.show();
        }
    }

	function carregar_imagem(img) {
        if (ultima_imagem_carregada < imagem_atual) {

            if (imageLoadingPanel.is(":visible")) {
                imageLoadingPanel.hide();
            }

            if (radar != null) {
                radar.remove();
            }

            img.id = 'image_timestamp';

            // draw the cropped image onto the canvas element
            canvasTimeCtx.drawImage(img, canvasTimeCtxCropping.x, canvasTimeCtxCropping.y, canvasTimeCtxCropping.width + 6, canvasTimeCtxCropping.height,
                10, 12, canvasTimeCtxCropping.width * 2, canvasTimeCtxCropping.height * 2);

            let url = get_url(imagem_atual);
			
            radar = L.imageOverlay(url, bounds).addTo(mymap);

			let imgOverlay = radar.getElement();
			
			//flipOverlayVertically(imgOverlay);
			
            ultima_imagem_carregada = imagem_atual;
        }
        else {
            if (imageLoadingPanel.is(":visible")) {
                imageLoadingPanel.hide();
            }
        }
	}

    function loadInfoMessage() {
        infoJson.style = 'visibility: hidden;';

        fetch('https://corsproxy.io/?url=https://www.sistema-alerta-rio.com.br/upload/Mapa/str.json?query=' + query)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.text();
            })
            .then(htmlString => {
                const data = JSON.parse(htmlString);
		              const estado = data.estado.toUpperCase();
                            if (estado.includes('NORMAL')) {
		                  return '';
		              }  
                infoJson.setAttribute('aria-label', estado + ' (atualizado às ' + data.data + ')\n ' + data.descricao);
                infoJson.style = 'visibility: visible;';
            })
            .catch(error => {
                console.error('Error fetching or parsing the HTML file:', error);
            });

        return '';
    }

    // função para atualizar as imagens caso esteja vindo do cache
    function atualizar() {
        query = Math.random();
        ultima_imagem_carregada = 0;

        mostrar_imagem();

        loadInfoMessage();
    }

    loadInfoMessage();

    play_pause();
});
