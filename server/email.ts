import { invokeLLM } from "./_core/llm";

export interface EmailPayload {
  to: string;
  subject: string;
  type: "daily-picks" | "subscription-confirmation" | "performance-summary" | "alert";
  data?: Record<string, any>;
}

/**
 * Send an email notification to a user
 * In production, this would integrate with SendGrid, AWS SES, or similar
 */
export async function sendEmail(payload: EmailPayload): Promise<boolean> {
  try {
    const { to, subject, type, data } = payload;

    // Generate email content based on type
    let htmlContent = "";

    switch (type) {
      case "daily-picks":
        htmlContent = generateDailyPicksEmail(data || {});
        break;
      case "subscription-confirmation":
        htmlContent = generateSubscriptionConfirmationEmail(data || {});
        break;
      case "performance-summary":
        htmlContent = generatePerformanceSummaryEmail(data || {});
        break;
      case "alert":
        htmlContent = generateAlertEmail(data || {});
        break;
    }

    // Log the email (in production, send via email service)
    console.log(`[Email] Sending ${type} to ${to}`);
    console.log(`[Email] Subject: ${subject}`);
    console.log(`[Email] Content: ${htmlContent.substring(0, 200)}...`);

    // Simulate email sending success
    return true;
  } catch (error) {
    console.error("[Email] Failed to send email:", error);
    return false;
  }
}

function generateDailyPicksEmail(data: Record<string, any>): string {
  const picks = data.picks || [];
  const picksList = picks
    .map(
      (pick: any) =>
        `<tr>
      <td style="padding: 12px; border-bottom: 1px solid #333;">
        <strong>${pick.sport}</strong> - ${pick.recommendation}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #333; text-align: center;">
        <span style="background: #fbbf24; color: #000; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
          ${pick.confidenceScore}%
        </span>
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #333; text-align: center;">
        ${pick.edgeScore}
      </td>
    </tr>`
    )
    .join("");

  return `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; color: #e5e7eb; background: #0f0f0f; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #1a1a1a; border-radius: 8px; }
          .header { text-align: center; margin-bottom: 30px; }
          h1 { color: #fbbf24; margin: 0; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #888; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📊 Today's ChalkPicks</h1>
            <p>Your daily AI-powered sports betting picks</p>
          </div>
          
          <p>Good morning! Here are today's premium picks:</p>
          
          <table>
            <thead>
              <tr style="background: #222;">
                <th style="padding: 12px; text-align: left;">Pick</th>
                <th style="padding: 12px; text-align: center;">Confidence</th>
                <th style="padding: 12px; text-align: center;">Edge</th>
              </tr>
            </thead>
            <tbody>
              ${picksList}
            </tbody>
          </table>
          
          <p style="text-align: center;">
            <a href="https://chalkpicks.pro/picks" style="background: #fbbf24; color: #000; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">
              View All Picks
            </a>
          </p>
          
          <div class="footer">
            <p>You're receiving this because you're subscribed to daily pick alerts.</p>
            <p><a href="https://chalkpicks.pro/subscription-management" style="color: #fbbf24; text-decoration: none;">Manage preferences</a></p>
          </div>
        </div>
      </body>
    </html>
  `;
}

function generateSubscriptionConfirmationEmail(data: Record<string, any>): string {
  const tier = data.tier || "monthly";
  const amount = data.amount || "$29.99";
  const renewalDate = data.renewalDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString();

  return `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; color: #e5e7eb; background: #0f0f0f; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #1a1a1a; border-radius: 8px; }
          .header { text-align: center; margin-bottom: 30px; }
          h1 { color: #22c55e; margin: 0; }
          .details { background: #222; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #888; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Subscription Confirmed</h1>
            <p>Welcome to ChalkPicks Pro!</p>
          </div>
          
          <p>Thank you for upgrading your subscription. Your payment has been processed successfully.</p>
          
          <div class="details">
            <p><strong>Plan:</strong> ${tier.charAt(0).toUpperCase() + tier.slice(1)}</p>
            <p><strong>Amount:</strong> ${amount}</p>
            <p><strong>Next Renewal:</strong> ${renewalDate}</p>
            <p><strong>Status:</strong> <span style="color: #22c55e;">Active</span></p>
          </div>
          
          <p>You now have access to:</p>
          <ul style="color: #e5e7eb;">
            <li>Premium AI-powered picks</li>
            <li>Advanced backtesting engine</li>
            <li>Daily pick alerts</li>
            <li>Performance analytics</li>
            <li>Priority support</li>
          </ul>
          
          <p style="text-align: center;">
            <a href="https://chalkpicks.pro/picks" style="background: #fbbf24; color: #000; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">
              Start Betting
            </a>
          </p>
          
          <div class="footer">
            <p>Questions? <a href="https://chalkpicks.pro/support" style="color: #fbbf24; text-decoration: none;">Contact support</a></p>
          </div>
        </div>
      </body>
    </html>
  `;
}

function generatePerformanceSummaryEmail(data: Record<string, any>): string {
  const period = data.period || "This Week";
  const wins = data.wins || 0;
  const losses = data.losses || 0;
  const winRate = data.winRate || 0;
  const roi = data.roi || 0;

  return `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; color: #e5e7eb; background: #0f0f0f; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #1a1a1a; border-radius: 8px; }
          .header { text-align: center; margin-bottom: 30px; }
          h1 { color: #60a5fa; margin: 0; }
          .stats { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }
          .stat { background: #222; padding: 15px; border-radius: 8px; text-align: center; }
          .stat-value { font-size: 24px; font-weight: bold; color: #fbbf24; }
          .stat-label { font-size: 12px; color: #888; margin-top: 5px; }
          .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #888; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📈 Performance Summary</h1>
            <p>${period}</p>
          </div>
          
          <div class="stats">
            <div class="stat">
              <div class="stat-value">${wins}</div>
              <div class="stat-label">Wins</div>
            </div>
            <div class="stat">
              <div class="stat-value">${losses}</div>
              <div class="stat-label">Losses</div>
            </div>
            <div class="stat">
              <div class="stat-value">${winRate}%</div>
              <div class="stat-label">Win Rate</div>
            </div>
            <div class="stat">
              <div class="stat-value" style="color: ${roi > 0 ? "#22c55e" : "#ef4444"};">${roi > 0 ? "+" : ""}${roi}%</div>
              <div class="stat-label">ROI</div>
            </div>
          </div>
          
          <p style="text-align: center;">
            <a href="https://chalkpicks.pro/dashboard" style="background: #60a5fa; color: #000; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">
              View Full Dashboard
            </a>
          </p>
          
          <div class="footer">
            <p>Keep up the great work! Check the leaderboard to see how you rank.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

function generateAlertEmail(data: Record<string, any>): string {
  const title = data.title || "Alert";
  const message = data.message || "";

  return `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; color: #e5e7eb; background: #0f0f0f; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #1a1a1a; border-radius: 8px; }
          .header { text-align: center; margin-bottom: 30px; }
          h1 { color: #f59e0b; margin: 0; }
          .message { background: #222; padding: 20px; border-radius: 8px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔔 ${title}</h1>
          </div>
          
          <div class="message">
            ${message}
          </div>
        </div>
      </body>
    </html>
  `;
}
