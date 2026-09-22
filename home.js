
/* =========================================================
   OUDANA — HOMEPAGE
   Homepage products
========================================================= */


/* =========================================================
   SUPABASE
========================================================= */

const SUPABASE_URL =
    "https://gpncttjpcucnbaatwjoy.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_emYCVcv_b9gLa62n3D1pPg_lI5xRnD4";

const supabaseClient =
    supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );


/* =========================================================
   DOM
========================================================= */

const productsGrid =
    document.getElementById("productsGrid");

const productsLoading =
    document.getElementById("productsLoading");

const productsEmpty =
    document.getElementById("productsEmpty");


/* =========================================================
   LOAD BEST SELLING PRODUCTS
   عرض أكثر منتجين مبيعًا فقط
========================================================= */

async function loadHomepageProducts() {

    if (!productsGrid) return;


    /* إظهار التحميل */

    productsLoading?.removeAttribute("hidden");

    productsEmpty?.setAttribute("hidden", "");

    productsGrid.innerHTML = "";


    /* =====================================================
       جلب المنتجات

       sales_count = عدد المبيعات

       ascending: false
       يعني من الأعلى إلى الأقل

       limit(2)
       يعني نعرض منتجين فقط
    ===================================================== */

    const {
        data,
        error
    } = await supabaseClient
        .from("products")
        .select("*")
        .eq("is_available", true)
        .order("sales_count", {
            ascending: false
        })
        .limit(2);


    /* =====================================================
       في حالة وجود خطأ
    ===================================================== */

    if (error) {

        console.error(
            "Homepage products error:",
            error
        );


        productsLoading?.setAttribute(
            "hidden",
            ""
        );


        productsEmpty?.removeAttribute(
            "hidden"
        );


        return;

    }


    /* إخفاء التحميل */

    productsLoading?.setAttribute(
        "hidden",
        ""
    );


    /* =====================================================
       لا توجد منتجات
    ===================================================== */

    if (!data || data.length === 0) {

        productsEmpty?.removeAttribute(
            "hidden"
        );

        return;

    }


    /* =====================================================
       عرض المنتجات
    ===================================================== */

    data.forEach(product => {

        const card =
            document.createElement("article");


        card.className =
            "product-card revealed";


        /* =================================================
           عند الضغط على المنتج
           الانتقال لصفحة المنتج نفسه
        ================================================= */

        card.addEventListener("click", () => {

            window.location.href =
                `product.html?id=${product.id}`;

        });


        /* =================================================
           محتوى بطاقة المنتج
        ================================================= */

        card.innerHTML = `

            <div class="product-image-wrap">

                <img
                    src="${escapeHtml(product.image_url || "")}"
                    alt="${escapeHtml(product.name || "منتج عودانا")}"
                    loading="lazy"
                >

            </div>


            <div class="product-info">

                <span class="product-category">
                    ${escapeHtml(product.category || "")}
                </span>

                <h3>
                    ${escapeHtml(product.name || "")}
                </h3>

                <p class="product-price">

                    ${Number(
                        product.price || 0
                    ).toLocaleString("ar-SA")}

                    ر.س

                </p>

            </div>

        `;


        productsGrid.appendChild(card);

    });

}


/* =========================================================
   HTML ESCAPE
========================================================= */

function escapeHtml(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


/* =========================================================
   INIT
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    loadHomepageProducts
);

