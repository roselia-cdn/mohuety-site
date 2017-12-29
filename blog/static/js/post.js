var resizer = function () {
    //document.getElementsByClassName('parallax-container')[0].style.minHeight = window.innerHeight - document.getElementById('mobile-nav').style.height + "px";
    $('.parallax-container').css({height: (window.innerHeight - $('#mobile-nav').height())*0.618 + "px"});
    $('#main-pic').css({width: (window.innerWidth)});
    //document.getElementById("homura").width = window.innerWidth;
};

window.app = {};
window.roselia = app;
utils.setUpEvents(app, ['load', 'unload', 'render']);
app.firstLoad = function () {
    $('.parallax-container').stop(false, true).animate({height: (window.innerHeight - $('#mobile-nav').height()) + "px"}, "normal", "swing")
        .delay(1000).animate({height: (window.innerHeight - $('#mobile-nav').height())*0.618 + "px"}, "normal", "swing");
    $("html,body").stop(false, true).delay(1200).animate({scrollTop: $("#content").offset().top}, "normal", "swing");
    $('#main-pic').css({width: (window.innerWidth)});
};
app.getPostNum = () => utils.getArguments().p || -1;

app.showContent = function (data) {
    document.title = data.title;
    let metaTitle = $("meta[name=apple-mobile-web-app-title]");
    metaTitle && metaTitle.attr("content", data.title);
    $("#main-title").html(data.title);
    $("#sub-title").html(data.subtitle);
    $("#date").html(data.date);
    $("#tags").html("");
    data.tags.forEach(function (t) {
        $("#tags").append(`<a href='./?tag=${t}'><div class='chip'>${t}</div></a>`);
    });
    let content = $("#content");
    content.html(data.content);
    $("#main-pic").attr('src', data.img || 'static/img/nest.png');
    content.find('img').each(function (i, item) {
        $(item).addClass('responsive-img');
    });
    content.find('p').each(function (i, item) {
        $(item).addClass('flow-text');
    });
    data.id && (data.id == app.getPostNum()?history.replaceState({id: data.id}, "", './post?p='+data.id):history.pushState({id: data.id}, "", './post?p='+data.id));
    app.setBtns();
    utils.colorUtils.apply({selector: "#main-pic", text:"#content,#sub-title,#date", changeText: true});
    //$.adaptiveBackground.run({selector:"#main-pic", parent: $("#content"), normalizeTextColor: true});
    //app.firstLoad();
};
app.setBtns = function () {
    let next = app.getOffset(1), prev = app.getOffset(-1);
    $("#next-btn").attr('href', './post?p=' + next).css('display', next>=0?"":"none");
    $("#prev-btn").attr('href', './post?p=' + prev).css('display', prev>=0?"":"none");
};
app.loadContent = function (p) {
    if(p === undefined) p = app.getPostNum();
    else this.triggerUnload();
    let notFound = {
            title: 'Page Not Found',
            subtitle: "Please check your post-id. Or try to <a href='login' onclick='utils.setRedirect(utils.getAbsPath())'" +">Login</a>",
            date: (new Date()).toDateString(),
            tags: ['404'],
            content: '<p>There might be some problem here. Please check your input</p>'
        };
    let userData = utils.getLoginData();
    let getData = {};
    if(userData){
        getData.token = userData.token;
    }
    if(p == -1){
        app.showContent(notFound);
    }else{
        let bar = new AdvBar();
        bar.startAnimate();
        $.ajax({
            type: 'GET',
            url: utils.apiFor('post', p),
            contentType: "application/json",
            dataType: 'json',
            data: getData,
            success: function (data) {
                app.loading = false;
                app.postData = data;
                if(data === 'null') {
                    data = null;
                }
                data || bar.abort();
                app.showContent(data || notFound);
                app.triggerLoad();
                bar.stopAnimate();
            },
            error: function () {
                //bar.setColor("#ff80ab", "#c51162");

                app.showContent(notFound);
                bar.abort("#ff80ab", "#c51162");
                //bar.stopAnimate();
            }
        });
        /*
        $.getJSON('./api/post/'+p, getData, function (data) {
            app.loading = false;
            app.postData = data;
            if(data === 'null') data = notFound;
            app.showContent(data || notFound);
            if(callback) callback();
        });*/
    }
};

app.getOffset = function (offset) {
    if(!app.postData) return -1;
    if(offset === 1) return app.postData.next;
    if(offset === -1) return app.postData.prev;
    let idx = app.getPostNum();
    let finalIdx = idx + offset;
    return (finalIdx >= 0)?finalIdx:-1;

};

app.shiftPost = function (offset) {
    let idx = app.getOffset(offset);
    if(idx === -1) return;
    //$("#content").fadeOut();

    app.loading = true;
    $("html,body").animate({scrollTop: 0});
    app.loadContent(idx);

};

app.setEditPage = function (e) {
    $(e).attr('href', './edit?post=' + app.getPostNum());
};

$(document).ready(function () {
    $(".button-collapse").sideNav();
    resizer();
    $('.parallax').parallax();
    $(window).resize(resizer);
    $(window).scroll(function(){
        $(".gotop")["fade"+["In", "Out"][($(window).height()>$(document).scrollTop())+0]](500);
    });
    let userData = utils.getLoginData();
    if(userData){
        $(".username").html(userData.username).attr('href', './userspace');
    }else{
        $(".username").attr('href', 'login').
        attr('onclick', 'utils.setRedirect(utils.getAbsPath())');
    }
    /*new Vue({
        el: "#post",
        data: {
            userData: userData
        }
    });*/
    new Vue({
        el: "#main",
        data: {
            app, userData
        }
    });
    app.loading = true;
    app.onLoad(utils.setHeimu);
    app.loadContent();
    window.addEventListener('popstate', e => e.state.id && app.loadContent(utils.setHeimu, e.state.id))
});