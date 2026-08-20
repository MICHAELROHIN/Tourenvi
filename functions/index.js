const { onSchedule } = require("firebase-functions/v2/scheduler");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");

admin.initializeApp();

// Initialize nodemailer transport (assuming standard SMTP or a service like Gmail/SendGrid)
// You would need to set up environment variables or Secret Manager in Firebase for actual credentials
const transporter = nodemailer.createTransport({
  service: "gmail", // e.g., 'gmail' or configure SMTP host/port
  auth: {
    user: process.env.EMAIL_USER || "your-email@gmail.com",
    pass: process.env.EMAIL_PASS || "your-email-password"
  }
});

/**
 * Cloud Function to send automated email reminders 24 hours before a trip.
 * Runs daily at 00:00 (midnight).
 */
exports.sendTripReminders = onSchedule("every day 00:00", async (event) => {
  try {
    const db = admin.firestore();
    const now = new Date();
    
    // Calculate the time range for "24 hours from now"
    // Since it runs daily, we'll look for trips starting between tomorrow 00:00 and 23:59
    const tomorrowStart = new Date(now);
    tomorrowStart.setDate(now.getDate() + 1);
    tomorrowStart.setHours(0, 0, 0, 0);

    const tomorrowEnd = new Date(tomorrowStart);
    tomorrowEnd.setHours(23, 59, 59, 999);

    // Query for trips starting exactly tomorrow
    const tripsSnapshot = await db
      .collection("trips")
      .where("startDate", ">=", admin.firestore.Timestamp.fromDate(tomorrowStart))
      .where("startDate", "<=", admin.firestore.Timestamp.fromDate(tomorrowEnd))
      .get();

    if (tripsSnapshot.empty) {
      console.log("No trips starting tomorrow. No reminders to send.");
      return;
    }

    const emailPromises = [];

    tripsSnapshot.forEach((doc) => {
      const tripData = doc.data();
      const userEmail = tripData.userEmail;
      
      if (!userEmail) {
        console.warn(`Trip ${doc.id} has no userEmail. Skipping.`);
        return;
      }

      const destination = tripData.destination || "your destination";
      const startDate = tripData.startDate.toDate().toLocaleDateString();
      const budgetCap = tripData.totalBudgetCap || "N/A";
      const dashboardLink = `https://tourenvi.com/dashboard/trip/${doc.id}`; // Adjust to your actual domain

      // Royal Blue and Gold themed HTML email
      const mailOptions = {
        from: '"Tourenvi Reminders" <noreply@tourenvi.com>',
        to: userEmail,
        subject: `Your Tourenvi trip to ${destination} is almost here! ✈️`,
        html: `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #E0E0E0; border-radius: 8px; overflow: hidden; background-color: #ffffff;">
            <div style="background-color: #0F3057; padding: 30px; text-align: center; border-bottom: 4px solid #D4AF37;">
              <h1 style="color: #D4AF37; margin: 0; font-size: 28px; letter-spacing: 1px;">Tourenvi</h1>
              <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px;">Your Premium Travel Companion</p>
            </div>
            
            <div style="padding: 30px; color: #333333;">
              <h2 style="color: #0F3057; margin-top: 0;">Get Ready for Your Adventure!</h2>
              <p style="font-size: 16px; line-height: 1.5;">
                Hello there,<br><br>
                This is a quick reminder that your exciting trip to <strong>${destination}</strong> is coming up in exactly 24 hours! We hope you're packed and ready to go.
              </p>
              
              <div style="background-color: #F8F9FA; border-left: 4px solid #D4AF37; padding: 15px; margin: 25px 0;">
                <h3 style="margin-top: 0; color: #0F3057; font-size: 18px;">Trip Summary</h3>
                <ul style="list-style: none; padding: 0; margin: 0; font-size: 15px;">
                  <li style="margin-bottom: 10px;">📍 <strong>Destination:</strong> ${destination}</li>
                  <li style="margin-bottom: 10px;">📅 <strong>Departure Date:</strong> ${startDate}</li>
                  <li style="margin-bottom: 0;">💰 <strong>Total Budget Cap:</strong> $${budgetCap}</li>
                </ul>
              </div>
              
              <p style="font-size: 16px; line-height: 1.5; margin-bottom: 30px;">
                Access your active itinerary dashboard to review your route, smart stops, and live navigation tracking before you hit the road.
              </p>
              
              <div style="text-align: center;">
                <a href="${dashboardLink}" style="display: inline-block; background-color: #D4AF37; color: #0F3057; text-decoration: none; font-weight: bold; font-size: 16px; padding: 14px 28px; border-radius: 4px; border: 2px solid #D4AF37; transition: background-color 0.3s ease;">
                  Open Itinerary Dashboard
                </a>
              </div>
            </div>
            
            <div style="background-color: #0F3057; color: #ffffff; text-align: center; padding: 20px; font-size: 12px;">
              <p style="margin: 0;">© ${new Date().getFullYear()} Tourenvi Travel Application. All rights reserved.</p>
              <p style="margin: 5px 0 0 0; color: #A0B2C6;">You are receiving this because you have an upcoming trip scheduled on Tourenvi.</p>
            </div>
          </div>
        `
      };

      emailPromises.push(transporter.sendMail(mailOptions));
    });

    await Promise.all(emailPromises);
    console.log(`Successfully sent ${emailPromises.length} trip reminder emails.`);
  } catch (error) {
    console.error("Error sending trip reminders:", error);
  }
});
