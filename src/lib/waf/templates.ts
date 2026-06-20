import { config } from "@/config/config";

export interface WafBlockTemplateProps {
  referenceId: string;
  ip: string;
  path: string;
  incidentId: string;
}

export function getWafBlockHtml(props: WafBlockTemplateProps): string {
  const { referenceId, ip, path, incidentId } = props;

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Acceso Bloqueado | ${config.app.name} Seguridad</title>
      <style>
        body { margin: 0; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #09090b; color: #fafafa; display: flex; align-items: center; justify-content: center; min-height: 100vh; overflow: hidden; }
        .container { max-width: 500px; width: 90%; padding: 40px; background-color: #18181b; border: 1px solid #27272a; border-radius: 20px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(239, 68, 68, 0.1); text-align: center; }
        .icon-wrapper { width: 64px; height: 64px; margin: 0 auto 24px; display: flex; align-items: center; justify-content: center; background-color: rgba(239, 68, 68, 0.1); border-radius: 16px; border: 1px solid rgba(239, 68, 68, 0.2); }
        .icon { width: 32px; height: 32px; color: #ef4444; }
        h1 { font-size: 20px; font-weight: 700; margin: 0 0 12px; color: #ffffff; letter-spacing: -0.025em; }
        p.desc { color: #a1a1aa; line-height: 1.6; margin: 0 0 32px; font-size: 14px; }
        .details { text-align: left; background-color: #09090b; border: 1px solid #27272a; padding: 20px; border-radius: 12px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 13px; color: #d4d4d8; }
        .details-row { display: flex; justify-content: space-between; padding-bottom: 12px; margin-bottom: 12px; border-bottom: 1px solid #27272a; }
        .details-row:last-child { padding-bottom: 0; margin-bottom: 0; border-bottom: none; }
        .label { color: #71717a; font-weight: 600; text-transform: uppercase; font-size: 11px; letter-spacing: 0.05em; }
        .value { font-weight: 500; text-align: right; word-break: break-all; max-width: 60%; }
        .footer { margin-top: 32px; font-size: 12px; color: #52525b; font-weight: 500; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="icon-wrapper">
          <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
        </div>
        <h1>Acceso Bloqueado</h1>
        <p class="desc">Tu solicitud ha sido interceptada y denegada por el <strong>Firewall de Aplicación (WAF)</strong> de ${config.app.name} debido a una política de seguridad estricta.</p>
        <div class="details">
          <div class="details-row"><span class="label">Motivo</span><span class="value" style="color: #ef4444;">${referenceId}</span></div>
          <div class="details-row"><span class="label">IP Cliente</span><span class="value">${ip}</span></div>
          <div class="details-row"><span class="label">Ruta</span><span class="value">${path}</span></div>
          <div class="details-row"><span class="label">Incidente ID</span><span class="value">${incidentId}</span></div>
        </div>
        <div class="footer">
          ${config.app.name} Security Edge &bull; Sistema de Protección Activo
        </div>
      </div>
    </body>
    </html>
  `;
}
