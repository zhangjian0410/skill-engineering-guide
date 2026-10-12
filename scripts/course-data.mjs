import fs from 'node:fs/promises';
import path from 'node:path';

// The web table and editable PPTX read the same downloadable fixture.
export async function loadTicketExample(root, fixture) {
 const rows=JSON.parse(await fs.readFile(path.join(root,fixture),'utf8'));
 const status={completed:'已完成',open:'待处理'};
 return {
  table:[['工单 ID','创建日期','状态','耗时 / 分钟'],
   ...rows.map(r=>[r.ticket_id,r.created_date,status[r.status],String(r.minutes)])],
  rows,
 };
}
