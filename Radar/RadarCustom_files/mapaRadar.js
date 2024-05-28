$(document).ready(function () {

    var layerOSM = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png?', {
        attribution: '&copy; OpenStreetMap Contributors.',
        maxZoom: 14,
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
        L.latLng(-24.431567, -45.336972),
        L.latLng(-21.478793, -41.159092)
    )

    //Desenha o circulo do alcançe do radar meteorológico
    L.circle([-22.965849, -43.2606667],
        {
            radius: 143200,
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
    var query = Math.random();
    
    var imageTimeDiv = $('#scandatediv');
    var imageLoading = $('#image_loading');
    var imageLoadingPanel = $('#loadingdiv');
    var apisources = $('#apisources');
    
    var selectedApiSource = localStorage.getItem("selectedApiSource");
    if (selectedApiSource == undefined || selectedApiSource == null) {
        selectedApiSource = "1";
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

    // Funcoes de controle das imagens
    function mudar_origem_dados(source) {
        
        if (source !== undefined) {
            selectedApiSource = source;

            localStorage.setItem("selectedApiSource", source);

            if (source == "1") {
                baseUrl = 'https://bpyu1frhri.execute-api.us-east-1.amazonaws.com/maparadar/radar';
                immagem_maxima = 20;
            }
            else if (source == "2") {
                baseUrl = 'https://imagens.climatempo.com.br/georio/radar/radar';
                immagem_maxima = 20;
            }
            else {
                baseUrl = 'https://www-sistema--alerta--rio-com-br.translate.goog/upload/Mapa/semfundo/radar';
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

        if (selectedApiSource == "3") {
            url = url + '&_x_tr_sch=http&_x_tr_sl=en&_x_tr_tl=pt&_x_tr_hl=pt-PT&_x_tr_pto=wapp';
        }

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

            if (imageLoading.is(":visible")) {
                imageLoading.hide();
                imageLoadingPanel.hide();
            }

            if (radar != null) {
                radar.remove();
            }

            let url = get_url(imagem_atual);

            let imageTime = document.getElementById('image_timestamp');

            imageTimeDiv.append(img);

            img.id = 'image_timestamp';

            radar = L.imageOverlay(url, bounds).addTo(mymap);

            ultima_imagem_carregada = imagem_atual;

            imageTime.remove();
        }
        else {
            if (imageLoading.is(":visible")) {
                imageLoading.hide();
                imageLoadingPanel.hide();
            }
        }

				}

    // função para atualizar as imagens caso esteja vindo do cache
    function atualizar() {
        query = Math.random();
        mostrar_imagem();
    }

});
