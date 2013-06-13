define(['durandal/app', 'knockout'], function (app, ko) {

    var CustomModal = function() {
        this.input = ko.observable('');
    };

    CustomModal.prototype.ok = function() {
        this.modal.close(this.input());
    };

    return CustomModal;
});