define(['paging','durandal/app'],function(paging,app){
    var ctor = function(obj,fields) {
        this.obj = obj;
        this.fields = fields;
        this.html = "<table style='display: none' class='table table-hover table-striped table-bordered'><thead>";
        for(var k in fields) {
            this.html += "<th>"+k+"</th>";
        }
        this.html += "<th>Ações</th></thead><tbody>";
        for(i = 0;i < obj.length;i++) {
            var item = obj[i];
            this.html += "<tr data-id='"+item["id"]+"'>";
            for(var k in fields) {
                field = fields[k];
                if(field == "status") {
                    this.html += "<td><a data-id="+item["id"]+" class='change_status btn btn-mini "+(item["status"] == "0" ? "btn-warning": "btn-success")+"'>"+(item["status"] == "0" ? "Inativo" : "Ativo")+"</a></td>";
                } else {
                    this.html += "<td>"+(item[field] ? item[field] : "")+"</td>";
                }
            }
            this.html += "<td><button class='btn btn-mini remove_item' data-id='"+item["id"]+"'><i class='icon-trash'></i> Excluir</button></td></tr>";
        }
        this.html += "</tbody></table>";
    }

    ctor.initializeTable = function(container_id) {
        $.extend($.fn.dataTableExt.oStdClasses, {
            "sSortAsc": "header headerSortDown",
            "sSortDesc": "header headerSortUp",
            "sSortable": "header"
        });

        $("#"+container_id).find('.table').dataTable( {
            "bPaginate": true,
            "bLengthChange": true,
            "bFilter": true,
            "bSort": true,
            "bInfo": false,
            "bAutoWidth": true,
            "sDom": "<'row-fluid'<'span6'l><'span6'f>r>t<'row-fluid'<'span6'i><'span6'p>>",
            "sPaginationType": "bootstrap",
            "oLanguage": {
                "sProcessing":   "A processar...",
                "sLengthMenu":   "Mostrar _MENU_ registros",
                "sZeroRecords":  "Não foram encontrados resultados",
                "sInfo":         "Mostrando de _START_ até _END_ de _TOTAL_ registos",
                "sInfoEmpty":    "Mostrando de 0 até 0 de 0 registros",
                "sInfoFiltered": "(filtrado de _MAX_ registos no total)",
                "sInfoPostFix":  "",
                "sSearch":       "Procurar:",
                "sUrl":          "",
                "oPaginate": {
                    "sFirst":    "Primeiro",
                    "sPrevious": "Anterior",
                    "sNext":     "Seguinte",
                    "sLast":     "Último"
                }
            }
        }).show();

        $("#"+container_id).find(".table tbody tr").on("click",function(){
            window.location.href = window.location.href+"/"+$(this).attr("data-id")+"/edit";
        });

        $("#"+container_id).find(".change_status").on("click",function(){
            var self = $(this);
            self.attr("disabled",true);
            $.post("user/update_status/"+self.attr("data-id"), function(r) {
                if(r.status) {
                    if(self.hasClass("btn-warning")) {
                        self.removeClass("btn-warning");
                        self.addClass("btn-success");
                        self.text("Ativo");
                    } else {
                        self.removeClass("btn-success");
                        self.addClass("btn-warning");
                        self.text("Inativo");
                    }
                } else {
                    app.showMessage(html_decode(r.msg));
                }
                self.attr("disabled",false);
            });
            return false;
        });

        $("#"+container_id).find(".remove_item").on("click",function(){
            var self = $(this);
            self.attr("disabled",true);
            app.showMessage("O item será excluído. Continuar?", "Atenção!",["Ok","Cancelar"]).then(
                function(response) {
                    if(response == "Ok") {
                        self.parent().parent().remove();
                        $.post(window.location.href.replace("#","")+"/delete/"+self.attr("data-id"), function(r){
                            if(r.status != true) {
                                app.showMessage(html_decode(r.msg));
                            }
                        });
                    } else {
                        self.attr("disabled",false);
                    }
                }
            );
            return false;
        });
    }

    return ctor;
});