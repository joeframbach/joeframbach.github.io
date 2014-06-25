// ==UserScript==
// @name       KeyboardOverflow
// @namespace  http://joe.framba.ch
// @version    0.1
// @description  Keyboard navigation for StackOverflow
// @match      http://stackoverflow.com/*
// @match      http://*.stackoverflow.com/*
// @copyright  2013+, Joe Frambach
// ==/UserScript==

GM_addStyle(
    ".question-summary.active { border-left: 5px solid #cccccc; }"
);

$ = jQuery = unsafeWindow.jQuery;

$(function() {
    
    var scrollTo = function(el) {
        var w_top = $(window).scrollTop();
        var w_height = $(window).height();
        var el_top = $(el).position().top;
        var el_height = $(el).height();
        if (el_top < w_top)
            $(window).scrollTop(el_top);
        else if (el_top + el_height > w_top + w_height)
            $(window).scrollTop(el_top - w_height + el_height);
    };
    
    $('.question-summary .summary').each(function(){var excerpt = $(this).find('a.question-hyperlink').attr('title'); $(this).find('h3').after($('<p>').text(excerpt));});
    $('.question-summary .votes .mini-counts').append($('<sup>'));

    var handlers = {
        'j': function() {
            var active = $('.question-summary.active')
            if (!active.length)
                active = $('.question-summary:first');
            else if (active.next().length == 0) return
            else
                active = active.removeClass('active').next();
            active.addClass('active');
            scrollTo(active);
        },
        'k': function() {
            var active = $('.question-summary.active');
            if (active.prev().length == 0) return;
            active = active.removeClass('active').prev().addClass('active');
            scrollTo(active);
        },
        'l': function() {
            var active = $('.question-summary.active');
            if (!active.length) return;
            location.href = active.find('a.question-hyperlink').attr('href');
        },
        'e': function() {
            var url = $('.question-summary.active a.question-hyperlink').attr('href');
            if (!url) return;
            location.href = '/posts/'+url.match(/questions\/(\d+)\//)[1]+'/edit';
        },
        'f': function() {
            location.href = '/';
        },
        'a': function() {
            var fkey = unsafeWindow.StackExchange.options.user.fkey;
            var active = $('.question-summary.active');
            if (!active.length) return;
            var sup = active.find('.votes .mini-counts sup');
            var url = active.find('a.question-hyperlink').attr('href');
            if (!url) return;
            var post_id = url.match(/questions\/(\d+)\//)[1];
            var vote = (sup.text() == '+') ? '0' : '2';
            $.post('/posts/'+post_id+'/vote/'+vote,{fkey:fkey},function(data){
                if (data.Success) {
                    sup.text(vote=='2'?'+':'');
                }
            });
        },
        'z': function() {
            var fkey = unsafeWindow.StackExchange.options.user.fkey;
            var active = $('.question-summary.active');
            if (!active.length) return;
            var sup = active.find('.votes .mini-counts sup');
            var url = active.find('a.question-hyperlink').attr('href');
            if (!url) return;
            var post_id = url.match(/questions\/(\d+)\//)[1];
            var vote = (sup.text() == '-') ? '0' : '3';
            $.post('/posts/'+post_id+'/vote/'+vote,{fkey:fkey},function(data){
                if (data.Success) {
                    sup.text(vote=='3'?'-':'');
                }
            });
        },
        'ctrl+input+s': function(evt) {
            $(evt.target).closest('form').find('input[type=submit]').click();
            console.log('save!');
        }
    };
    
    var textAcceptingInputTypes = ["text", "password", "number", "email", "url", "range", "date", "month", "week", "time", "datetime", "datetime-local", "search", "color", "tel"];
    var special = {
        8: "backspace", 9: "tab", 10: "return", 13: "return", 16: "shift", 17: "ctrl", 18: "alt", 19: "pause",
        20: "capslock", 27: "esc", 32: "space", 33: "pageup", 34: "pagedown", 35: "end", 36: "home",
        37: "left", 38: "up", 39: "right", 40: "down", 45: "insert", 46: "del", 
        96: "0", 97: "1", 98: "2", 99: "3", 100: "4", 101: "5", 102: "6", 103: "7",
        104: "8", 105: "9", 106: "*", 107: "+", 109: "-", 110: ".", 111 : "/", 
        112: "f1", 113: "f2", 114: "f3", 115: "f4", 116: "f5", 117: "f6", 118: "f7", 119: "f8", 
        120: "f9", 121: "f10", 122: "f11", 123: "f12", 144: "numlock", 145: "scroll", 186: ";", 191: "/",
        220: "\\", 222: "'", 224: "meta"
    };

    $(document).on('keydown', function(evt) {
        var key = '';
        if (evt.altKey) key += 'alt+';
        if (evt.ctrlKey) key += 'ctrl+';
        if ( this !== evt.target && (/textarea|select/i.test( evt.target.nodeName ) || jQuery.inArray(event.target.type, textAcceptingInputTypes) > -1 ) )
            key += 'input+';
        if (evt.shiftKey) key += 'shift+';
        if (evt.metaKey) key += 'meta+';
        key += special[evt.which] || String.fromCharCode(evt.which).toLowerCase();
        try {
            if (handlers[key]) {
                handlers[key](evt);
                evt.preventDefault();
                return false;
            }
        } catch(err) {
            console.log(err);
        }
    });

});
