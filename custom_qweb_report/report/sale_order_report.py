from odoo import api, models
from bahttext import bahttext
# ต้อง install bahttext lib ก่อน
# pip/pip3 install bahttext

class ParticularReport(models.AbstractModel):
    _name = 'report.custom_qweb_report.sale_order_report_view'

    @api.multi
    def _get_report_values(self, docids, data=None):
        docs = self.env['sale.order'].browse(docids)
        thaibahttext = ''
        for doc in docs:
            thaibahttext = bahttext(doc.amount_total)
        return {
            'doc_ids': docs.ids,
            'doc_model': 'sale.order',
            'docs': docs,
            'thaibahttext': thaibahttext,
        }