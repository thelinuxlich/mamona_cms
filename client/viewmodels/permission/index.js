define(['knockout','durandal/app','viewmodels/table/index'],
function (ko,app,Table) {
    return {
        table: ko.observable(),
        attachedToParent: function() {
            Table.initializeTable("permissions");
        },
        activate: function() {
            var that = this;
            $.get("permission").then(function(r){
                var table = new Table(r,{'#': 'id','Recurso': 'resource','Nível': 'role_name','Leitura': 'action_read','Gravação': 'action_write','Remoção': 'action_remove'},["Excluir"]);
                that.table(table.html);
            });
        }
    };
});