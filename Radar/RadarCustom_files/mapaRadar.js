$(document).ready(function () {

    var layerOSM = L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png?', {
        attribution: '&copy; OpenStreetMap Contributors.',
        maxZoom: 18,
    });

    var mymap = L.map('mapid',
        {
            zoomControl: false,
            layers: [layerOSM,],
        }
    ).setView([-22.9499, -43.4199], 8);

    //Plota o controle de zoom canto inferior direito
    L.control.zoom().setPosition('bottomright').addTo(mymap)


    // Bounds das imagens do radar
    var bounds = L.latLngBounds(
        L.latLng(-24.431567, -45.336972),
        L.latLng(-21.478793, -41.159092)
    )

    //Desenha o circulo do alcançe do radar meteorológico
    var circulo = L.circle([-22.960849, -43.2646667],
        {
            radius: 138900,
            weight: 2,
            dashArray: '10 10',
            color: '#00F',
            fill: false,
        }).addTo(mymap);


    var intervalo_radar = null;
    var imagem_atual = 1;
    var play = true;
    var radar = null;
    var baseUrl = 'https://bpyu1frhri.execute-api.us-east-1.amazonaws.com/maparadar/radar';
    var query = 0;
    var imageTime = $("#image_timestamp");


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
        mostrar_imagem();
    }

    function imagem_anterior() {
        if (imagem_atual > 1) {
            imagem_atual -= 1;
        } else {
            imagem_atual = 20;
        }
        mostrar_imagem();
    }

    function mostrar_imagem() {
        var url = baseUrl + (
            String('000' + imagem_atual).slice(-3)
        ) + '.png?query=' + query;
        carregar_imagem(url);
    }

    function painel_imagens(url) {
        try {
            $.get(url).then(
                function (data, status, xhr) {
                    var date = xhr.responseText.substring(
                        xhr.responseText.search('modify') + 7, xhr.responseText.search('modify') + 32
                    );

                }
            );
        }
        catch {

        }
    }

    function carregar_imagem(url) {
        if (radar != null) {
            radar.remove();
        }
        radar = L.imageOverlay(url, bounds).addTo(mymap);
        //painel_imagens(url);

        imageTime.attr("src", url); 
    }

    // função para atualizar as imagens caso esteja vindo do cache
    function atualizar() {
        query = Math.random();
        mostrar_imagem();
    }

});
