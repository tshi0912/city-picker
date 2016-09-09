$(function () {

    'use strict';


    var $citypicker1 = $('#city-picker1');

    $citypicker1.citypicker();

    var $citypicker2 = $('#city-picker2');

    $citypicker2.citypicker({
        province: '江苏省',
        city: '常州市',
        district: '溧阳市'
    });

    var $citypicker3 = $('#city-picker3');

    $('#reset').click(function () {
        $citypicker3.citypicker('reset');
    });

    $('#destroy').click(function () {
        $citypicker3.citypicker('destroy');
    });

    $('#get-code').click(function () {
        var count = $('#code-count').data('count');
        var code = $citypicker3.data('citypicker').getCode(count);
        $(this).find('.code').text(': ' + code);
    });

    $('.dropup .dropdown-menu a').click(function () {
        var $btn = $('#code-count');
        $btn.data('count', $(this).data('count')).find('.text').text($(this).text());
        if ($('#get-code .code').text()) {
            $('#get-code').trigger('click');
        }
    });

});
