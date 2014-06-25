// ==UserScript==
// @name       KeyboardOverflow
// @namespace  http://joe.framba.ch
// @version    0.12
// @description  Keyboard navigation for StackOverflow
// @match      http://stackoverflow.com/*
// @match      http://*.stackoverflow.com/*
// @require    http://joe.framba.ch/jquery.min.js
// @require    http://joe.framba.ch/jquery.widget.js
// @require    http://joe.framba.ch/jquery.notify.js
// @copyright  2013+, Joe Frambach
// ==/UserScript==

$(function() {
    
    var scrollToActive = function() {
        var w_top = $(window).scrollTop();
        var w_height = $(window).height();
        var el_top = active.position().top-31;
        var el_height = active.height();
        if (el_top <= w_top || el_top + el_height > w_top + w_height)
            $(window).scrollTop(el_top);
    };
    var click = function(el) {
        var clickEvent = document.createEvent("HTMLEvents");
        clickEvent.initEvent("click", true, true);
        $(el)[0].dispatchEvent(clickEvent);
    }
    
    $('<link>').attr({href:'http://joe.framba.ch/ui.notify.css',rel:'stylesheet',type:'text/css'}).appendTo($('head'));

    GM_addStyle(
        ".active { border-left: 5px solid #cccccc; }"+
        ".question-summary div.excerpt { display: none; }"+
        ".question-summary.active div.excerpt { display: block; }"+
        ".ui-notify { z-index: 10001; }"+
        ".ui-notify-message-style { background: none; position: relative; }"+
        ".ui-notify-message-style .hotkey { position: absolute; top: 0; left: 0; background: #c0c0c0; }"
    );

    $('#question-mini-list .question-summary.tagged-interesting').detach().prependTo($('#question-mini-list'));
    $('.question-summary .summary').each(function(){
        var excerpt = $(this).find('a.question-hyperlink').attr('title');
        $(this).find('h3').after($('<div>').addClass('excerpt').text(excerpt));
    });
    $('.question-summary .votes .mini-counts').append($('<sup>'));
    var active = $('.question-summary, #question, #questions .question').first().addClass('active');
    var fkey = unsafeWindow.StackExchange.options.user.fkey;
    var profile_url = unsafeWindow.StackExchange.options.user.profileUrl;

    var setIntervalNow = function(cb, interval) { cb(); return setInterval(cb, interval); };
    setIntervalNow(function() {
        $.get('/questions?sort=newest',function(html) {
            $('.ui-notify').remove();
            var notify = $('<div>').appendTo($('#content'));
            var count = 0;
            $(html).find('.question-summary .summary').filter(function(){
                return (new Date())-(new Date($(this).find('.user-action-time span.relativetime').attr('title'))) < 30000;
            }).each(function() {
                if (count < 10) {
                    $(this).append($('<span>').addClass('hotkey').text(count));
                    var url = $(this).find('a.question-hyperlink').attr('href');
                    handlers[count] = function() {
                        window.open(url,'_blank');
                    };
                }
                var excerpt = $(this).find('a.question-hyperlink').attr('title');
                $(this).find('h3').after($('<div>').addClass('excerpt').text(excerpt));
                $(this).css({'float':'none','padding-bottom':'28px'});
                notify.append($(this));
                count++;
            });
            notify.notify();
            for (var i=0; i<count; i++) {
                notify.notify("create",i,{},{expires:30000});
            }
            delete notify;
        });
    }, 30000);

    var handlers = {
        'j': function() {
            if (!active.length) return;
            active.removeClass('active');
            active = (function(next) {
                if ((next = active.next('.question-summary')).length)
                    return next;
                if ((next = active.nextAll('.answer').first()).length)
                    return next;
                if ((next = active.nextAll('#answers').first().find('.answer').first()).length)
                    return next;
                return active;
            })().addClass('active');
            scrollToActive();
        },
        'k': function() {
            if (!active.length) return;
            active.removeClass('active');
            active = (function(next) {
                if ((next = active.prev('.question-summary')).length)
                    return next;
                if ((next = active.prevAll('.answer').first()).length)
                    return next;
                if ((next = active.parent('#answers').prevAll('.question').first()).length)
                    return next;
                return active;
            })().addClass('active');
            scrollToActive();
        },
        'l': function() {
            if (!active.length) return;
            location.href = active.find('a.question-hyperlink, .result-link a').attr('href');
        },
        'e': function() {
            if (!active.length) return;
            var url = active.find('a.question-hyperlink').attr('href');
            if (!url) return;
            location.href = '/posts/'+url.match(/questions\/(\d+)\//)[1]+'/edit';
        },
        'f': function() {
            location.href = '/';
        },
        'i': function() {
            location.href = profile_url + '?tab=responses';
        },
        'q': function() {
            location.href = '/questions';
        },
        'r': function() {
            location.href = profile_url + '?tab=reputation';
        },
        'a': function() {
            if (!active.length) return;
            var upvote = active.find('.vote-up-off').first();
            if (upvote.length) {
                click(upvote);
                return;
            }
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
            if (!active.length) return;
            var downvote = active.find('.vote-down-off');
            if (downvote.length) {
                click(downvote);
                return;
            }
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
        'ctrl+input+s': function(e) {
            $(e.target).closest('form').find('input[type=submit]').click();
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
    
    $('#mainbar').on('click','.question-summary, .question, .answer',function() {
        $('.active').removeClass('active');
        active = $(this).addClass('active');
    });

    $(document).on('keydown', function(e) {
        e = e || window.event;
        var key = '';
        if (e.altKey) key += 'alt+';
        if (e.ctrlKey) key += 'ctrl+';
        if ( this !== e.target && (/textarea|select/i.test( e.target.nodeName ) || jQuery.inArray(e.target.type, textAcceptingInputTypes) > -1 ) )
            key += 'input+';
        if (e.shiftKey) key += 'shift+';
        if (e.metaKey) key += 'meta+';
        key += special[e.which] || String.fromCharCode(e.which).toLowerCase();
        try {
            if (handlers[key]) {
                handlers[key](e);
                e.preventDefault();
                return false;
            }
        } catch(err) {
            console.log(err);
        }
    });

});

