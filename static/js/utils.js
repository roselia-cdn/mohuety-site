/**
 * Created by somai on 2017/8/21.
 */
BLOG_TITLE = 'Roselia-Blog';
BLOG_MOTTO = 'Do what you want to do, be who you want to be.';
window.utils = {};

utils.getArguments = function () {
    let argStr = window.location.search;
    if(!argStr.length) return {};
    let args = window.location.search.substring(1).split('&');
    let argDict = {};
    args.forEach(function (i) {
        let item = i.split("=");
        argDict[decodeURIComponent(item[0])] = decodeURIComponent(item[1]);
    });
    return argDict;
};

utils.setRedirect = function (url) {
    window.sessionStorage.setItem('redirectURL', url);
};

utils.getRedirect = function () {
    return window.sessionStorage.getItem('redirectURL');
};

utils.cleanRedirect = function () {
    window.sessionStorage.removeItem('redirectURL');
};

utils.setHeimu = () => {
    $(".heimu").mouseover((e) => {
      $(e.target).css("color", "white");
    }).mouseout((e) => {
      $(e.target).css("color", "black");
    });
};

utils.getAbsPath = function () {
    return window.location.pathname + window.location.search;
};

utils.redirectTo = url => window.location.href = url || './';

utils.getLoginData = () => window.localStorage.loginData ? JSON.parse(window.localStorage.loginData):null;

utils.setLoginData = data => window.localStorage.loginData = JSON.stringify(data);

(function ($) {
    $(document).ready(function () {
        $('.blog-title').html(BLOG_TITLE);
        $('.blog-motto').html(BLOG_MOTTO);
    });
})(jQuery);
