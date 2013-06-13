define(['durandal/app','viewmodels/table/index'],
function (app,Table) {
    this.table = "";
    return {
        table: this.table,
        viewAttached: function() {
            Table.initializeTable("permissions");
        },
        activate: function() {
            var that = this;
            return $.get("permission").then(function(r){
                var table = new Table(r,{'#': 'id','Recurso': 'resource','Nível': 'role_name','Leitura': 'action_read','Gravação': 'action_write','Remoção': 'action_remove'});
                that.table = table.html;
            });
        }
    };
});