$(document).ready(function () {
    $(".button-collapse").sideNav();
    addEventListener("storage", e => {
        e.key === "loginData" && (e.newValue || (utils.setRedirect(utils.getAbsPath()), utils.redirectTo("./login")));
    });
    app.loading = false;
    let lang = navigator.language || navigator.browserLanguage;
    let i18n;
    if(lang.startsWith('zh')){
        $("html").attr('lang', 'zh-Hans');
        i18n = app.makeTranslation('zh');
    }else{
        i18n = app.makeTranslation('en');
    }
    //new Vue({ i18n }).$mount("#content");
    if(!window.localStorage.loginData){
        Materialize.toast("Please login first!", 3000, '', function () {
            utils.setRedirect(utils.getAbsPath());
            window.location.href = './login';
        });
    }
    let isFirstRun = utils.getArguments().firstrun;
    if(!isFirstRun && window.sessionStorage.suToken) window.sessionStorage.removeItem('suToken');
    app.mainVue = new Vue({
        el: '#content',
        data: {
            app: app,
            userData: utils.getLoginData(),
            users: []
        }, i18n: i18n
    });
    $.ajaxSetup({
        error: function () {
            app.loading = false;
            shock('#login-form');
            Materialize.toast("Connection error.", 3000);
        }
    });
    $("#retype-password").keypress(function (e) {
        if(e.keyCode === 13){//enter
            $("#login-button").click();
        }
    });
    $("#su-password").keypress(function (e) {
        if(e.keyCode === 13){//enter
            app.getSUToken();
        }
    });
    utils.setLoginUI();
    $("select").material_select();
    isFirstRun && app.openManage();

});

function shock(obj) {
    $(obj).stop(!0, !0);
    for (let i = 1; i < 6; i++) {
        $(obj).animate({
            'left': '-=15'
        }, 3, function() {
            $(this).animate({
                'left': '+=30'
            }, 3, function() {
                $(this).animate({
                    'left': '-=15'
                }, 3, function() {

                });
            });
        });
    }
}
window.app = {};
app.loading = true;
app.remoteCode = "";
app.userMeta = {};
app.userData = utils.getLoginData();
app.uploadedImages = [];
app.submitChange = function (username, oldPassword, newPassword, token, success, error) {
    $.post(utils.apiFor('user', 'change'),{
        username: username, oldPassword: oldPassword, newPassword: newPassword, token: token || ""
    } , function (data, stat) {
        if(!(data.success)){
            error && error(data.msg);
            return;
        }
        success && success();

    });
};
app.changePassword = function () {
    app.loading = true;
    let oldPassword = $("#old-password").val();
    let newPassword = $("#new-password").val();
    let confirmPassword = $("#retype-password").val();
    if(!(oldPassword && newPassword) || (newPassword !== confirmPassword)){
        shock('#login-form');
        app.loading = false;
        return false;
    }
    console.log($("#login-data").serialize());
    this.submitChange(utils.getLoginData().username, oldPassword, newPassword, '', function () {
        app.loading = !1;
        Materialize.toast("Password Changed",2000);
        $("#change-password").fadeOut();
    }, function (msg) {
        shock('#login-form');
        Materialize.toast(msg, 2000);
        app.loading = false;
    });
};

app.loadUser = function () {
    let userData = utils.getLoginData();
    if(!userData.role){
        Materialize.toast('You are not supposed to do this.', 2000);
        return;
    }
    app.loading = true;
    let bar = new AdvBar();
    bar.startAnimate();
    $.ajax({
        type: "GET",
        url: utils.apiFor("user", "list"),
        contentType: "application/json",
        dataType: "json",
        data: {token: userData.token},
        success(raw_data){
            if(!raw_data.success){
                Materialize.toast('Load failed.', 2000);
                bar.abort();
                utils.setRedirect(utils.getAbsPath());
                window.location.href = './login';
            }else{
                app.mainVue.users = raw_data.data;
                bar.stopAnimate();
                $('#manage').fadeIn();
            }
            app.loading = false;
        },
        error(){
            bar.abort();
            Materialize.toast('Network Error!', 2000);
        }
    });
};

app.openManage = function () {
    if(window.sessionStorage.suToken){
        $("#manage").fadeIn();
    }else{
        $('#modal-su').modal().modal('open');
    }
};

app.getSUToken = function () {
    let password = $("#su-password").val();
    if(!password) return;
    let bar = new AdvBar();
    bar.createBar($("#modal-su")[0]);
    bar.startAnimate();
    $.post(utils.apiFor('user', 'su'), {
        username: utils.getLoginData().username,
        password: password
    }, function(raw_data){
        if(!raw_data.success){
            Materialize.toast('Wrong Password.', 2000);
            shock("#modal-su");
            bar.abort();
        }else{
            bar.stopAnimate();
            window.sessionStorage.setItem("suToken", raw_data.token);
            $("#modal-su").modal('close');
            app.loadUser();
        }
    });
};

app.openDelete = function (username) {
    $("#delete-user").html(username);
    $("#modal-delete").modal().modal('open');
};

app.commitDelete = function () {
    let username = $("#delete-username").val().toLowerCase();
    if(!username || $("#delete-user").html().toLowerCase() !== username) {
        shock("#modal-delete");
        return;
    }
    let bar = new AdvBar();
    bar.createBar($("#modal-delete")[0]);
    bar.startAnimate();
    $.ajax({
        type: "DELETE",
        url: utils.apiFor("user", "remove"),
        contentType: "application/json",
        dataType: "json",
        data: JSON.stringify({username: username, token:window.sessionStorage.suToken || ''}),
        success: function (data) {
            if(data.success){
                bar.stopAnimate();
                Materialize.toast("Success!", 2000);
                $("#modal-delete").modal('close');
                app.loadUser();
            }else{
                bar.abort();
                if(data.msg === 'expired'){
                    Materialize.toast('Token Expired!', 2000, "", function () {
                        window.sessionStorage.removeItem('suToken');
                        $("#manage").fadeOut();
                    });
                }else{
                    Materialize.toast(data.msg,2000);
                }
            }
        },
        error:function () {
            bar.abort();
            Materialize.toast("Network Error!", 2000);
        }
    })
};

app.addUser = function () {
    let username = $("#username").val();
    let password = $("#password").val();
    let role = $("#user-role").val();
    let bar = new AdvBar();
    bar.createBar($("#modal-add")[0]);
    bar.startAnimate();
    utils.fetchJSON(utils.apiFor("user", "add"), "POST",
        {username: username, password: password, role:role, token: window.sessionStorage.suToken || ''},
        false).then(function (data) {
            if(data.success){
                bar.stopAnimate();
                Materialize.toast("Success!", 2000);
                $("#modal-add").modal('close');
                app.loadUser();
            }else{
                shock("#modal-add");
                bar.abort();
                if(data.msg === 'expired'){
                    Materialize.toast('Token Expired!', 2000, "", function () {
                        window.sessionStorage.removeItem('suToken');
                        $("#manage").fadeOut();
                    });
                }else{
                    Materialize.toast(data.msg,2000);
                }
            }
        }).catch(function () {
            shock("#modal-add");
            bar.abort();
            Materialize.toast("Network Error!", 2000);
        });
};

app.openSet = function (username) {
    $("#change-user").html(username);
    $("#modal-set").modal().modal('open');
};

app.commitSet = function () {
    let password = $("#set-password").val();
    let username = $("#change-user").html();
    if(!(password && username)) {shock("#modal-set");return;}
    let bar = new AdvBar();
    bar.createBar($("#modal-set")[0]);
    bar.startAnimate();
    app.submitChange(username, '', password, window.sessionStorage.suToken, function () {
        bar.stopAnimate();$("#modal-set").modal('close');
    }, function () {
        shock("#modal-set");
        bar.abort();
    });
};

app.scanCode = function (code) {
    app.loading = true;
    utils.fetchJSON(utils.apiFor("login", "code", "scan", code), "POST").then(data => {
        app.loading = false;
        if(!data.success) {
            utils.notify(data.msg);
            shock("#remote-login-form");
            return;
        }
        app.confirmCodeModal(data.msg);
    }).catch(_ => {
        app.loading = false;
        utils.notify("Network error.");
        shock("#remote-login-form");
    });
};

app.confirmCodeModal = function (meta) {
    app.userMeta = meta;
    $("#modal-remote").modal().modal('open');
};

app.confirmCode = function () {
    app.loading = true;
    utils.fetchJSON(utils.apiFor("login", "code", "confirm", app.remoteCode), "POST").then(data => {
        if(!data.success){
            utils.notify(data.msg);
        }
        $("#remote-login").fadeOut();
        $("#modal-remote").modal('close');
    }).catch(_ => {bar.abort(); utils.notify("Network error")}).finally(_ => app.loading = false);
};

app.refreshToken = function () {
    app.loading = true;
    let bar = new AdvBar;
    bar.startAnimate();
    utils.refreshToken().then(data => app.userData = data, msg => {
        utils.notify(msg);
        utils.setRedirect();
        utils.redirectTo('login');
    }).then(_ => bar.stopAnimate(), _ => bar.abort()).finally(_ => app.loading = false);
};

app.getUploadedImage = function(){
    let bar = new AdvBar;
    bar.createBar($("#image-management-form")[0]);
    bar.startAnimate();
    utils.fetchJSONWithSuccess(utils.apiFor('pic', 'list')).then(pics => {
        app.uploadedImages = pics;
        bar.stopAnimate();
        $("#image-management").fadeIn();
    }).catch(bar.abort().bind(bar));
};

app.deleteUploadedImage = function (fileName) {
    let images = this.uploadedImages.map(e => e.fileName);
    if (!images.includes(fileName)) return;
    let bar = new AdvBar;
    bar.startAnimate();
    utils.fetchJSONWithSuccess(utils.apiFor('pic', 'remove'), "POST", {fileName}).then(data => {
        bar.stopAnimate();
        app.uploadedImages.splice(images.indexOf(fileName), 1);
    }).catch(msg => {
        utils.notify(msg);
        bar.abort();
        msg && msg === 'File Not Found' && app.uploadedImages.splice(images.indexOf(fileName), 1);
    });
};

app.makeTranslation = function (locale) {
    let messages = {
        en: {
            message:{
                logout: 'Logout',
                operation: 'Operations',
                hello: 'Welcome, {0}!',
                changePW: 'Change Password',
                inputPW: 'Input your password',
                optManage: 'Manage',
                safeInputPW: 'For your safety, please input your password',
                password: 'Password',
                username: 'Username',
                close: 'Close',
                OK: 'OK',
                add: 'Add',
                user: 'User',
                addUser: 'Add User',
                delUser: 'Delete User',
                del: 'Delete',
                set: 'Set',
                setPW: 'Set Password',
                setPWInform: 'You are setting password of:',
                enterNewPW: 'Enter new password',
                manage: 'Manage ' + utils.BLOG_TITLE||"Roselia-Blog",
                manageWelcome: 'Welcome, master. You can do ANY thing you want.',
                delInform: 'You are deleting:',
                delConfirm: 'To make sure what you are doing, please confirm the username.',
                change: 'Change',
                oldPW: 'Old Password',
                newPW: 'New Password',
                confirmPW: 'Confirm Password',
                changePWInform: 'Change password for {0}',
                remoteLogin: 'Remote login',
                loginCode: 'Login Code',
                remoteMeta: 'Will login at {os} {browser} device on {ip}',
                userRole: 'User Level',
                refreshToken: 'Session Relet',
                manageImages: "Manage Images"
            }
        },
        zh: {
            message:{
                logout: '登出',
                operation: '您想做些什么呢？',
                hello: '欢迎，{0}！',
                changePW: '更改您的密码',
                inputPW: '输入您的密码',
                optManage: '管理（为所欲为）',
                safeInputPW: '为了您的安全，请输入您的密码',
                password: '密码',
                username: '用户名',
                close: '关闭',
                OK: '好',
                add: '添加',
                user: '用户',
                addUser: '添加用户',
                delUser: '删除用户',
                del: '删除',
                set: '设置',
                setPW: '设置密码',
                setPWInform: '您正在设置密码，其用户名为：',
                enterNewPW: '输入新的密码',
                manage: '管理 ' + utils.BLOG_TITLE||'Roselia-Blog',
                manageWelcome: '欢迎，主人！在这里您可以为所欲为。',
                delInform: '您正在删除：',
                delConfirm: '为了确保您没有吃错药，请确认用户名。',
                change: '更改',
                oldPW: '旧密码',
                newPW: '新密码',
                confirmPW: '确认密码',
                changePWInform: '设置{0}的密码',
                remoteLogin: '远程登入',
                loginCode: '登入代码',
                remoteMeta: '将登入位于 {ip} 的 {os} {browser}设备',
                userRole: "用户权限等级",
                refreshToken: '会话续租',
                manageImages: "上传图片管理"
            }
        },jp: {
            message:{
                logout: '登出',
                operation: '何かしたい？',
                hello: 'こにちは，{0}！',
                changePW: '更改您的密码',
                inputPW: '输入您的密码',
                optManage: '管理（为所欲为）',
                safeInputPW: '为了您的安全，请输入您的密码',
                password: '密码',
                username: '用户名',
                close: '关闭',
                OK: '好',
                add: '添加',
                user: '用户',
                addUser: '添加用户',
                delUser: '删除用户',
                del: '删除',
                set: '设置',
                setPW: '设置密码',
                setPWInform: '您正在设置密码，其用户名为：',
                enterNewPW: '输入新的密码',
                manage: '管理 ' + utils.BLOG_TITLE||'Roselia-Blog',
                manageWelcome: '欢迎，主人！在这里您可以为所欲为。',
                delInform: '您正在删除：',
                delConfirm: '为了确保您没有吃错药，请确认用户名。',
                change: '更改',
                oldPW: '旧密码',
                newPW: '新密码',
                confirmPW: '确认密码',
                changePWInform: '设置{0}的密码',
                remoteLogin: '远程登入',
                loginCode: '登入代码',
                remoteMeta: '将登入位于 {ip} 的 {os} {browser}设备',
                userRole: "用户权限",
                refreshToken: '会话续租',
                manageImages: "上传图片管理"
            }
        },
    };
    return new VueI18n({
        locale: locale, messages:messages
    });
};