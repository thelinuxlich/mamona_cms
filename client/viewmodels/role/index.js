define(['knockout','durandal/app','viewmodels/table/index'],
function (ko,app,Table) {
    return {
        table: ko.observable(),
        attachedToParent: function() {
            Table.initializeTable("roles");
        },
        activate: function() {
            var that = this;
            $.get("role").then(function(r){
                var table = new Table(r,{'#': 'id','Nome': 'name','Descrição': 'description'},["Excluir"]);
                that.table(table.html);
            });
        }
    };
});