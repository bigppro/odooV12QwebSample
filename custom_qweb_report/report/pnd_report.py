from odoo import api, models

class ParticularReport(models.AbstractModel):
    _name = 'report.custom_qweb_report.pnd_report_view'

    @api.multi
    def _get_report_values(self, docids, data=None):
        docs = self.env['sale.order'].browse(docids)
        return {
            'doc_ids': docs.ids,
            'doc_model': 'sale.order',
            'docs': docs,
        }