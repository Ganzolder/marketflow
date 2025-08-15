
import { getCampaignById } from '@/lib/data';
import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/page-header';

type PrintPageProps = {
  params: {
    id: string;
    actionId: string;
  };
};

export default async function PrintOrderPage({ params }: PrintPageProps) {
  const campaign = await getCampaignById(params.id);
  const action = campaign?.actions.find((a) => a.id === params.actionId);

  if (!campaign || !action) {
    notFound();
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  const plannedBudget = action.activities?.reduce((sum, activity) => sum + activity.budget, 0) || 0;

  return (
    <html lang="ru">
        <head>
            <title>Приказ о проведении: {action.name}</title>
            <style>
                {`
                    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap');
                    body {
                        font-family: 'Inter', sans-serif;
                        line-height: 1.6;
                        color: #000;
                        background-color: #fff;
                        max-width: 800px;
                        margin: 40px auto;
                        padding: 20px;
                    }
                    .page {
                        page-break-after: always;
                        min-height: 29.7cm;
                        display: flex;
                        flex-direction: column;
                    }
                    .page:last-child {
                        page-break-after: avoid;
                    }
                    .title-page {
                        display: flex;
                        flex-direction: column;
                        justify-content: space-between;
                        flex-grow: 1;
                    }
                    h1 {
                        text-align: center;
                        font-size: 24px;
                        font-weight: bold;
                        margin: auto;
                    }
                    .footer-details {
                       margin-top: auto;
                    }
                    .footer-details p {
                        margin: 10px 0;
                    }
                    .content p, .content li {
                        margin-bottom: 12px;
                    }
                    .content ol {
                        padding-left: 20px;
                    }
                    .signature-block {
                        margin-top: 50px;
                    }
                    .signature-line {
                        display: inline-block;
                        border-bottom: 1px solid #000;
                        width: 200px;
                        margin: 0 10px;
                    }
                    .acquainted-block {
                        margin-top: 30px;
                    }
                     .acquainted-block p {
                        margin: 5px 0;
                     }

                    @media print {
                        body {
                            margin: 0;
                            padding: 0;
                        }
                        .no-print {
                            display: none;
                        }
                    }
                `}
            </style>
        </head>
        <body>
            <div className="page">
                <div className="title-page">
                    <h1>Приказ о проведении маркетингового мероприятия</h1>
                    <div className="footer-details">
                        <p>№ ______</p>
                        <p>г. Томск</p>
                        <p>Дата: {new Date().toLocaleDateString('ru-RU')}</p>
                    </div>
                </div>
            </div>

            <div className="page">
                <div className="content">
                    <p>В целях повышения узнаваемости бренда, увеличения продаж и привлечения новых клиентов</p>
                    <p style={{textAlign: 'center', fontWeight: 'bold'}}>ПРИКАЗЫВАЮ:</p>
                    <ol>
                        <li>Провести маркетинговое мероприятие "{action.name || '____________________'}" в период с {formatDate(action.startDate)} по {formatDate(action.endDate)}.</li>
                        <li>Ответственным за организацию и проведение мероприятия назначить {action.responsiblePerson || '____________________'}.</li>
                        <li>Маркетинговому отделу ({action.marketingHead || '____________________'}) обеспечить:
                            <ul>
                                <li>- разработку концепции и плана мероприятия;</li>
                                <li>- подготовку рекламных материалов (баннеры, листовки, промопосты и т. д.);</li>
                                <li>- взаимодействие с партнёрами и подрядчиками;</li>
                                <li>- контроль за исполнением бюджета.</li>
                            </ul>
                        </li>
                        <li>Отделу продаж (____________________) обеспечить участие сотрудников в мероприятии и подготовку специальных предложений для клиентов.</li>
                        <li>IT-отделу ({action.itHead || '____________________'}) обеспечить техническую поддержку онлайн-части мероприятия (если требуется).</li>
                        <li>Финансовому отделу ({action.financeHead || '____________________'}) выделить необходимый бюджет в размере {new Intl.NumberFormat('ru-RU').format(plannedBudget)} рублей и осуществлять контроль за его расходованием.</li>
                        <li>Контроль за исполнением приказа возложить на {action.curator || '____________________'}.</li>
                    </ol>
                    <p>Основание: План маркетинговых активностей на ____________________, служебная записка ____________________.</p>

                    <div className="signature-block">
                        Директор <span className="signature-line"></span> /Гавриленко А.С.
                    </div>

                    <div className="acquainted-block">
                        <p>С приказом ознакомлены:</p>
                        <p>Нечепуренко А.В., гл.бухгалтер <span className="signature-line" style={{width: '100px'}}></span></p>
                        <p>Опалева К.В., маркетолог <span className="signature-line" style={{width: '100px'}}></span></p>
                    </div>
                </div>
            </div>
        </body>
    </html>
  );
}
