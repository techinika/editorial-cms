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
<h2 style="margin:0 0 16px;font-size:22px;color:#1a202c;">Welcome aboard!</h2>
<p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#374151;">Thank you for subscribing to the Techinika newsletter. We're excited to have you join our community of technology enthusiasts and learners.</p>
<p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#374151;">Here's what you can expect from us:</p>
<ul style="margin:0 0 20px;padding-left:20px;font-size:15px;line-height:1.8;color:#374151;">
  <li>Weekly articles on technology and innovation</li>
  <li>Tutorials and how-to guides</li>
  <li>Industry news and insights</li>
  <li>Tips for leveraging technology in your work</li>
</ul>
<p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#374151;">Stay curious, keep learning, and we'll see you in your inbox!</p>
    `,
  },
  {
    id: "newsletter",
    name: "Monthly Newsletter",
    subject: "Your Monthly Newsletter is Here!",
    body: `
<h2 style="margin:0 0 8px;font-size:22px;color:#1a202c;">Monthly Newsletter</h2>
<p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#6b7280;">Here are our top articles this month</p>
<p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#374151;">We've been busy creating content to help you stay ahead in the world of technology. Here's a roundup of our most popular articles from this month.</p>
<p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#374151;">Browse through them and let us know which ones resonated with you the most.</p>
    `,
  },
  {
    id: "announcement",
    name: "Announcement",
    subject: "Important Announcement",
    body: `
<h2 style="margin:0 0 16px;font-size:22px;color:#1a202c;">Announcement</h2>
<div style="border-left:4px solid #3182ce;padding:16px 20px;background-color:#eff6ff;border-radius:0 8px 8px 0;margin:0 0 20px;">
  <p style="margin:0;font-size:15px;line-height:1.6;color:#1e40af;">We have an exciting update to share with you.</p>
</div>
<p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#374151;">Write the details of your announcement here. Keep it clear, concise, and engaging.</p>
<p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#374151;">We look forward to hearing your thoughts!</p>
    `,
  },
  {
    id: "product-update",
    name: "Product Update",
    subject: "What's New at Techinika",
    body: `
<h2 style="margin:0 0 16px;font-size:22px;color:#1a202c;">What's New</h2>
<p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#374151;">We've been working on some exciting improvements and new features. Here's a look at what's changed.</p>
<div style="background-color:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:20px;margin:0 0 16px;">
  <h3 style="margin:0 0 8px;font-size:16px;color:#1a202c;">Feature Name</h3>
  <p style="margin:0;font-size:14px;line-height:1.6;color:#6b7280;">Describe the first update or feature here.</p>
</div>
<div style="background-color:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:20px;margin:0 0 20px;">
  <h3 style="margin:0 0 8px;font-size:16px;color:#1a202c;">Another Update</h3>
  <p style="margin:0;font-size:14px;line-height:1.6;color:#6b7280;">Describe the second update or feature here.</p>
</div>
<p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#374151;">Try out these new features and let us know what you think!</p>
    `,
  },
];
