import { mutation, query, QueryCtx, MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import { Doc, Id } from "./_generated/dataModel";

type Product = Doc<"products">;

export const getProducts = query({
    args: {
        status: v.optional(v.string()),
        search: v.optional(v.string()),
    },
    handler: async (ctx: QueryCtx, args: { status?: string; search?: string }) => {
        let products = await ctx.db.query("products").collect();

        if (args.status) {
            if (args.status === 'available') {
                products = products.filter((p: Product) => p.quantity > 0);
            } else if (args.status === 'out_of_stock') {
                products = products.filter((p: Product) => p.quantity === 0);
            }
        }

        if (args.search) {
            const s = args.search.toLowerCase();
            products = products.filter((p: Product) =>
                (p.product_name || "").toLowerCase().includes(s) ||
                (p.product_number || "").toLowerCase().includes(s) ||
                (p.car_name || "").toLowerCase().includes(s) ||
                (p.type || "").toLowerCase().includes(s) ||
                (p.model_number || "").toLowerCase().includes(s)
            );
        }

        // Resolve image URLs
        const resolved = await Promise.all(products.map(async (p: Product) => {
            let url = p.image || null;
            if (p.image && !p.image.startsWith("http")) {
                url = await ctx.storage.getUrl(p.image);
            }
            return { ...p, imageUrl: url };
        }));

        // Sort by last_update desc
        resolved.sort((a, b) => b.last_update.localeCompare(a.last_update));
        return resolved;
    },
});

export const addProduct = mutation({
    args: {
        product_number: v.optional(v.string()),
        product_name: v.string(),
        car_name: v.string(),
        model_number: v.string(),
        type: v.string(),
        quantity: v.number(),
        price_iqd: v.number(),
        wholesale_price_iqd: v.number(),
        image: v.optional(v.string()),
        original_quantity: v.optional(v.number()),
        message_id: v.optional(v.number()),
        status: v.optional(v.string()),
        last_update: v.optional(v.string()),
    },
    handler: async (ctx: MutationCtx, args: any) => {
        let p_num = args.product_number;
        if (!p_num) {
            // Generate a random product number if not provided
            p_num = "PROD-" + Math.random().toString(36).substring(2, 9).toUpperCase();
        }

        const existing = await ctx.db
            .query("products")
            .withIndex("by_product_number", (q) => q.eq("product_number", p_num))
            .first();

        if (existing) {
            if (args.product_number) {
                throw new Error("رقم المنتج موجود بالفعل");
            } else {
                // If we generated it and it exists, use timestamp for guaranteed uniqueness
                p_num = "PROD-" + Date.now().toString(36).slice(-6).toUpperCase();
            }
        }

        return await ctx.db.insert("products", {
            ...args,
            product_number: p_num,
            original_quantity: args.original_quantity ?? args.quantity,
            status: args.status ?? (args.quantity > 0 ? "متوفر" : "نفذ"),
            last_update: args.last_update ?? new Date().toISOString(),
        });
    },
});

export const updateProduct = mutation({
    args: {
        id: v.id("products"),
        updates: v.object({
            product_name: v.optional(v.string()),
            car_name: v.optional(v.string()),
            model_number: v.optional(v.string()),
            type: v.optional(v.string()),
            quantity: v.optional(v.number()),
            price_iqd: v.optional(v.number()),
            wholesale_price_iqd: v.optional(v.number()),
            image: v.optional(v.string()),
            message_id: v.optional(v.number()),
            status: v.optional(v.string()),
            last_update: v.optional(v.string()),
            product_number: v.optional(v.string()),
        })
    },
    handler: async (ctx: MutationCtx, args: { id: Id<"products">; updates: any }) => {
        const product = await ctx.db.get(args.id);
        if (!product) throw new Error("Product not found");

        const newQuantity = args.updates.quantity !== undefined ? args.updates.quantity : product.quantity;
        const status = newQuantity > 0 ? "متوفر" : "نفذ";

        const patch: any = {
            ...args.updates,
            status,
            last_update: new Date().toISOString()
        };

        if (patch.product_number === "") {
            patch.product_number = "PROD-" + Math.random().toString(36).substring(2, 9).toUpperCase();
        }

        await ctx.db.patch(args.id, patch);
    }
});

export const deleteProduct = mutation({
    args: { id: v.id("products") },
    handler: async (ctx: MutationCtx, args: { id: Id<"products"> }) => {
        await ctx.db.delete(args.id);
    }
});

export const getStats = query({
    handler: async (ctx: QueryCtx) => {
        const products = await ctx.db.query("products").collect() as Product[];
        const total_value = products.reduce((acc: number, p: Product) => acc + (p.price_iqd * p.quantity), 0);
        const total_items = products.reduce((acc: number, p: Product) => acc + p.quantity, 0);
        const available_products = products.filter((p: Product) => p.quantity > 0).length;

        // Group by type
        const by_type: Record<string, any> = {};
        products.forEach((p: Product) => {
            if (!by_type[p.type]) by_type[p.type] = { count: 0, quantity: 0, value: 0 };
            by_type[p.type].count++;
            by_type[p.type].quantity += p.quantity;
            by_type[p.type].value += (p.price_iqd * p.quantity);
        });

        // Group by car
        const by_car: Record<string, any> = {};
        products.forEach((p: Product) => {
            if (!by_car[p.car_name]) by_car[p.car_name] = { count: 0, quantity: 0 };
            by_car[p.car_name].count++;
            by_car[p.car_name].quantity += p.quantity;
        });

        return {
            overview: {
                total_products: products.length,
                available_products,
                out_of_stock: products.length - available_products,
                total_value,
                total_items,
            },
            by_type,
            by_car
        };
    }
})
