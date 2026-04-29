export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
}

export const DEFAULT_TEMPLATES: EmailTemplate[] = [
  {
    id: "welcome",
    name: "Welcome Email",
    subject: "Welcome to our newsletter!",
    body: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #3182ce;">Welcome!</h1>
        <p>Thank you for subscribing to our newsletter.</p>
        <p>We'll keep you updated with our latest articles and news.</p>
        <div style="margin: 30px 0;">
          <a href="{{site_url}}" style="background-color: #3182ce; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">Visit Our Site</a>
        </div>
        <p><small>If you didn't subscribe, you can <a href="{{unsubscribe_url}}">unsubscribe here</a>.</small></p>
      </div>
    `,
  },
  {
    id: "newsletter",
    name: "Monthly Newsletter",
    subject: "Your Monthly Newsletter is Here!",
    body: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #3182ce;">Monthly Newsletter</h1>
        <p>Here are our top articles this month:</p>
        <ul>
          <li><a href="{{article_1_url}}">{{article_1_title}}</a></li>
          <li><a href="{{article_2_url}}">{{article_2_title}}</a></li>
          <li><a href="{{article_3_url}}">{{article_3_title}}</a></li>
        </ul>
        <div style="margin: 30px 0;">
          <a href="{{site_url}}/articles" style="background-color: #3182ce; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">View All Articles</a>
        </div>
        <p><small>If you didn't subscribe, you can <a href="{{unsubscribe_url}}">unsubscribe here</a>.</small></p>
      </div>
    `,
  },
  {
    id: "breaking",
    name: "Breaking News",
    subject: "Breaking: {{news_title}}",
    body: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #e53e3e;">Breaking News!</h1>
        <h2>{{news_title}}</h2>
        <p>{{news_summary}}</p>
        <div style="margin: 30px 0;">
          <a href="{{article_url}}" style="background-color: #e53e3e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">Read More</a>
        </div>
        <p><small>If you didn't subscribe, you can <a href="{{unsubscribe_url}}">unsubscribe here</a>.</small></p>
      </div>
    `,
  },
  {
    id: "promotion",
    name: "Special Promotion",
    subject: "Special Offer Just for You!",
    body: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #38a169;">Special Offer!</h1>
        <p>We have a special promotion just for our subscribers:</p>
        <div style="background-color: #f0fff4; border: 1px solid #38a169; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h2 style="color: #38a169; margin: 0 0 10px 0;">{{offer_title}}</h2>
          <p>{{offer_description}}</p>
          <p style="font-size: 24px; font-weight: bold; color: #38a169;">{{offer_price}}</p>
        </div>
        <div style="margin: 30px 0;">
          <a href="{{offer_url}}" style="background-color: #38a169; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">Claim Offer</a>
        </div>
        <p><small>If you didn't subscribe, you can <a href="{{unsubscribe_url}}">unsubscribe here</a>.</small></p>
      </div>
    `,
  },
];
