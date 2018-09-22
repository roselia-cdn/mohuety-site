/**
 * Created by somai on 2017/9/16.
 */
window.app = {};

app.getInfo = function () {
    const args = utils.getArguments();
    this.redirectURI = args["redirect_uri"];
    this.appToken = args["app_token"];
    this.appName = args["app_name"];
    this.isValid = (this.redirectURI && this.appToken && this.appName) && true || false;
    if(!this.isValid) {
        return;
    }
    this.loginData = utils.getLoginData();
    if(!this.loginData) return this.goLogIn(this.appName);
};

app.goLogIn = function (appName) {
    window.sessionStorage.message = `Login to ${appName || app.appName || ""} with ${utils.BLOG_TITLE}.`;
    utils.setRedirect(utils.getAbsPath());
    utils.redirectTo("./login");
};

app.authorize = function () {
    this.loading = true;
    $.post(utils.apiFor('oauth', 'authorize'), {
        "app_token": this.appToken, 'user_token': this.loginData.token
    }, function (data) {
        if(data.msg === "expired") app.goLogIn();
        else app.callBack(data.success, data.msg, data.username)
    })
};

app.callBack = function (success, payload, username) {
    let data = {success: success};
    if(success) {data.token = payload; data.username = username;}
    else data.reason = payload;
    utils.redirectTo(`${app.redirectURI}?${utils.encodeArgs(data)}`)
};

$(function () {
    app.loading = false;
    app.getInfo();
    app.blogName = utils.BLOG_TITLE;
    app.mainVue = new Vue({
        el: '#content',
        data: app
    });
});