$(document).ready(function () {

    var layerOSM = L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png?', {
        attribution: '&copy; OpenStreetMap Contributors.',
        maxZoom: 18,
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

    // Bounds das imagens do radar
    var bounds = L.latLngBounds(
        L.latLng(-24.431567, -45.336972),
        L.latLng(-21.478793, -41.159092)
    )

    //Desenha o circulo do alcançe do radar meteorológico
    L.circle([-22.960849, -43.2646667],
        {
            radius: 138900,
            weight: 3,
            dashArray: '10 10',
            color: '#00F',
            fill: false,
        }).addTo(mymap);

    var intervalo_radar = null;
    var imagem_atual = 1;
    var ultima_imagem_carregada = 0;
    var play = true;
    var radar = null;
    var baseUrl = 'https://bpyu1frhri.execute-api.us-east-1.amazonaws.com/maparadar/radar';
    var query = Math.random();
    var imageTime = $('#image_timestamp');
    var imageLoading = $('#image_loading');

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
        if (imagem_atual < 20) {
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
            imagem_atual = 20;
        }
        ultima_imagem_carregada = 0;
        mostrar_imagem();
    }

    function get_url(imagem)
    {
        let url = baseUrl + (
            String('000' + imagem).slice(-3)
        ) + '.png?query=' + query;

        return url;
    }

    function mostrar_imagem() {
        let img = new Image();
        img.onload = function () {
            carregar_imagem();
        };
        let url = get_url(imagem_atual);

        if (imageLoading.is(":hidden")) { 
            imageLoading.removeClass('easeload');
            imageLoading.css('opacity', '0');
            imageLoading.show();
            imageLoading.addClass('easeload');
            imageLoading.css('opacity', '1');
        }

        img.src = url;
    }

				function carregar_imagem() {
								if (ultima_imagem_carregada < imagem_atual) {
												if (radar != null) {
																radar.remove();
            }
            
            let url = get_url(imagem_atual);
												imageTime.attr("src", url);
            radar = L.imageOverlay(url, bounds).addTo(mymap);

            ultima_imagem_carregada = imagem_atual;
        }
        if (imageLoading.is(":visible")) {
            imageLoading.hide();
        }
				}

    // função para atualizar as imagens caso esteja vindo do cache
    function atualizar() {
        query = Math.random();
        mostrar_imagem();
    }

});
