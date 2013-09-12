define(function(){
    var Permission = function() {
        this.id = "";
        this.resource = ko.observable();
        this.action_read = ko.observable();
        this.action_write = ko.observable();
        this.action_remove = ko.observable();
        this.role_id = ko.observable();
    };

    return Permission;
});