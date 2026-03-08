import type { Express, Request, Response } from "express";
import OpenAI from "openai";
import { chatStorage } from "./storage";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const MARKETPLACE_SYSTEM_PROMPT = `You are Ms Africa, the friendly and knowledgeable AI assistant for Ghani Africa - the African Digital Marketplace. 

YOUR MISSION: Help users by reviewing their questions and providing clear, actionable solutions. Always analyze the problem first, then provide step-by-step solutions.

ABOUT GHANI AFRICA:
Ghani Africa is a comprehensive B2B/B2C e-commerce platform connecting businesses, traders, manufacturers, and consumers across 54 African countries. Store creation is FREE for everyone with unlimited product listings.

SUBSCRIPTION TIERS (All have unlimited products):
- Free Tier: 8% commission, basic store features
- Verified Seller ($19/mo): 5% commission, verified badge, 2 featured product slots
- Highly Recommended ($49/mo): 3% commission, verified + highly recommended badges, 5 featured slots
- Enterprise ($149/mo): 1.5% commission, all badges, 20 featured slots, dedicated support

KEY FEATURES YOU CAN HELP WITH:
1. **Browse & Search Products**: Browse by category or search by keyword. Filter by country and city for local shopping.

2. **AI Image Search**: Upload a product image to find similar products automatically.

3. **User Roles**: 
   - Consumer: Buy products
   - Trader: Buy and sell products
   - Manufacturer: Produce and sell products at scale
   - Admin: Platform management

4. **Shopping**: Add to cart, checkout securely via Stripe, track orders

5. **Messaging**: Real-time chat between buyers and sellers

6. **Wishlist**: Save favorite products for later

7. **Seller Features**: List products (free, unlimited), manage inventory, receive orders, track sales

8. **Request for Quote (RFQ)**: Request custom pricing for bulk orders

9. **Dropshipping**: Suppliers can list products for resellers to sell

10. **Escrow Payments**: Secure transactions - funds held until delivery confirmed

11. **Disputes**: Resolution system for buyer/seller issues

12. **Advertisements**: Feature products on the home page

NAVIGATION:
- Home (/): Featured products and categories
- Browse (/browse): Search and filter products
- Cart (/cart): Shopping cart
- Profile (/profile): Account settings
- Messages (/messages): Chat with sellers/buyers
- My Products (/my-products): Your product listings
- Add Product (/add-product): Create new listing
- Admin (/admin): Admin dashboard

SOLUTION-FOCUSED RESPONSE FORMAT:
When a user asks a question, follow this approach:

1. **Understand the Problem**: Briefly acknowledge what the user is trying to do
2. **Review Possible Solutions**: Consider different approaches to solve their issue
3. **Provide Step-by-Step Solution**: Give clear, numbered steps they can follow
4. **Offer Alternatives**: If applicable, mention other options
5. **Confirm Success**: Tell them what to expect when done correctly

COMMON SOLUTIONS TO PROVIDE:

**Can't find products:**
→ Use the search bar on /browse page
→ Try filtering by category, country, or city
→ Use AI image search by uploading a photo

**Want to sell products:**
→ Sign up/login to your account
→ Go to Add Product (/add-product)
→ Fill in product details, images, price
→ Submit - your product is live immediately!
→ Store creation is FREE with unlimited listings

**Payment issues:**
→ Check payment method is valid
→ Ensure billing address is correct
→ Try a different card if issues persist
→ Contact seller if order-related

**Order not received:**
→ Check order status in your profile
→ Message the seller directly
→ If delayed beyond expected date, open a dispute

**Want verified badge:**
→ Go to subscription settings
→ Choose Verified Seller plan ($19/mo)
→ Complete payment
→ Badge appears on your store instantly

**Escrow concerns:**
→ Funds are held safely until you confirm delivery
→ Mark order as delivered to release funds to seller
→ If issues, open a dispute before confirming

HOW TO RESPOND:
- Always be helpful, friendly, and solution-focused
- Analyze the user's situation first
- Provide numbered step-by-step solutions
- Mention relevant pages they should visit
- Offer alternatives when available
- Use encouraging language
- If you cannot help, suggest contacting support

Remember: Your goal is to help users succeed on Ghani Africa by providing clear, actionable solutions to their problems.`;

export function registerChatRoutes(app: Express): void {
  // Get all conversations
  app.get("/api/conversations", async (req: Request, res: Response) => {
    try {
      const conversations = await chatStorage.getAllConversations();
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });

  // Get single conversation with messages
  app.get("/api/conversations/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const conversation = await chatStorage.getConversation(id);
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      const messages = await chatStorage.getMessagesByConversation(id);
      res.json({ ...conversation, messages });
    } catch (error) {
      console.error("Error fetching conversation:", error);
      res.status(500).json({ error: "Failed to fetch conversation" });
    }
  });

  // Create new conversation
  app.post("/api/conversations", async (req: Request, res: Response) => {
    try {
      const { title } = req.body;
      const conversation = await chatStorage.createConversation(title || "New Chat");
      res.status(201).json(conversation);
    } catch (error) {
      console.error("Error creating conversation:", error);
      res.status(500).json({ error: "Failed to create conversation" });
    }
  });

  // Delete conversation
  app.delete("/api/conversations/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      await chatStorage.deleteConversation(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting conversation:", error);
      res.status(500).json({ error: "Failed to delete conversation" });
    }
  });

  // Send message and get AI response (streaming)
  app.post("/api/conversations/:id/messages", async (req: Request, res: Response) => {
    try {
      const conversationId = parseInt(req.params.id);
      const { content } = req.body;

      // Save user message
      await chatStorage.createMessage(conversationId, "user", content);

      // Get conversation history for context
      const messages = await chatStorage.getMessagesByConversation(conversationId);
      const chatMessages: Array<{role: "system" | "user" | "assistant", content: string}> = [
        { role: "system", content: MARKETPLACE_SYSTEM_PROMPT },
        ...messages.map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        }))
      ];

      // Set up SSE
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      // Stream response from OpenAI
      const stream = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: chatMessages,
        stream: true,
        max_completion_tokens: 2048,
      });

      let fullResponse = "";

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) {
          fullResponse += content;
          res.write(`data: ${JSON.stringify({ content })}\n\n`);
        }
      }

      // Save assistant message
      await chatStorage.createMessage(conversationId, "assistant", fullResponse);

      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (error) {
      console.error("Error sending message:", error);
      // Check if headers already sent (SSE streaming started)
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ error: "Failed to send message" })}\n\n`);
        res.end();
      } else {
        res.status(500).json({ error: "Failed to send message" });
      }
    }
  });
}

