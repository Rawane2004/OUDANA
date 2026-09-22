/* =========================================================
   OUDANA — PROFILE
   Customer Account
   Supabase + Customers + Orders + Addresses
   + Complaints + Favorites + Security
========================================================= */


/* =========================================================
   SUPABASE
========================================================= */

const PROFILE_SUPABASE_URL =
    "https://gpncttjpcucnbaatwjoy.supabase.co";

const PROFILE_SUPABASE_KEY =
    "sb_publishable_emYCVcv_b9gLa62n3D1pPg_lI5xRnD4";

const profileSupabase =
    supabase.createClient(
        PROFILE_SUPABASE_URL,
        PROFILE_SUPABASE_KEY
    );


/* =========================================================
   GLOBAL STATE
========================================================= */

let currentUser = null;
let currentCustomer = null;
let currentOrders = [];
let currentAddresses = [];
let currentComplaints = [];
let currentFavoritesCount = 0;



    /* =====================================================
       HEADER SCROLL
    ===================================================== */

    const header = document.getElementById("header");

    window.addEventListener("scroll", () => {

        if (window.scrollY > 80) {
            header.classList.add("scrolled");
        } else {
            header.classList.remove("scrolled");
        }

    });




/* =========================================================
   HELPERS
========================================================= */

function $(id) {
    return document.getElementById(id);
}


function escapeHTML(value) {

    if (value === null || value === undefined) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function showMessage(element, message, type = "success") {

    if (!element) {
        return;
    }

    element.textContent = message;

    element.className =
        `form-message ${type}`;

    setTimeout(() => {

        element.textContent = "";

        element.className =
            "form-message";

    }, 5000);
}


function setButtonLoading(button, loading, text = "") {

    if (!button) {
        return;
    }

    if (loading) {

        button.dataset.originalText =
            button.innerHTML;

        button.disabled = true;

        button.innerHTML =
            `<i class="fa-solid fa-spinner fa-spin"></i> جاري التنفيذ...`;

    } else {

        button.disabled = false;

        if (button.dataset.originalText) {

            button.innerHTML =
                button.dataset.originalText;

        } else if (text) {

            button.innerHTML = text;
        }
    }
}


function formatPrice(price) {

    const number =
        Number(price || 0);

    return number.toLocaleString(
        "ar-SA",
        {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }
    ) + " ر.س";
}


function formatDate(date) {

    if (!date) {
        return "-";
    }

    return new Date(date).toLocaleDateString(
        "ar-SA",
        {
            year: "numeric",
            month: "long",
            day: "numeric"
        }
    );
}


function formatOrderNumber(order) {

    return order.order_number ||
        `ORD-${String(order.id).slice(0, 8).toUpperCase()}`;
}


/* =========================================================
   ORDER STATUS
========================================================= */

function getOrderStatusText(status) {

    const statuses = {

        new: "طلب جديد",

        processing: "قيد التجهيز",

        completed: "مكتمل",

        cancelled: "ملغي"

    };

    return statuses[status] ||
        status ||
        "غير محدد";
}


function getOrderStatusClass(status) {

    const classes = {

        new: "status-new",

        processing: "status-processing",

        completed: "status-completed",

        cancelled: "status-cancelled"

    };

    return classes[status] ||
        "status-new";
}


/* =========================================================
   GET CURRENT USER
========================================================= */

async function getCurrentProfileUser() {

    const {
        data,
        error
    } = await profileSupabase.auth.getUser();


    if (error) {

        console.error(
            "خطأ في جلب المستخدم:",
            error
        );

        return null;
    }


    return data?.user || null;
}


/* =========================================================
   LOAD / CREATE CUSTOMER
========================================================= */
/* =========================================================
   LOAD / CREATE CUSTOMER
========================================================= */

async function loadCustomer() {

    if (!currentUser) {
        return null;
    }

    try {

        /* -----------------------------------------
           أولًا: نحاول جلب العميل
        ----------------------------------------- */

        const {
            data,
            error
        } = await profileSupabase

            .from("customers")

            .select("*")

            .eq(
                "user_id",
                currentUser.id
            )

            .limit(1)

            .maybeSingle();


        if (error) {

            console.error(
                "❌ خطأ في جلب بيانات العميل:",
                error
            );

            /*
             * نعرض الخطأ الحقيقي في Console
             * حتى نعرف هل المشكلة RLS أو غيرها.
             */

            currentCustomer = null;

            return null;
        }


        /* -----------------------------------------
           العميل موجود
        ----------------------------------------- */

        if (data) {

            currentCustomer = data;

            console.log(
                "✅ تم العثور على بيانات العميل:",
                currentCustomer
            );

            return data;
        }


        /* -----------------------------------------
           العميل غير موجود
           ننشئ سجل جديد
        ----------------------------------------- */

        const metadata =
            currentUser.user_metadata || {};


        const customerName =
            metadata.full_name ||
            metadata.name ||
            currentUser.email?.split("@")[0] ||
            "عميل عودانا";


        console.log(
            "ℹ️ لا يوجد سجل customers، سيتم إنشاؤه..."
        );


        const {
            data: newCustomer,
            error: insertError
        } = await profileSupabase

            .from("customers")

            .insert({

                user_id:
                    currentUser.id,

                name:
                    customerName,

                email:
                    currentUser.email || null,

                phone:
                    metadata.phone || null,

                city:
                    metadata.city || null

            })

            .select()

            .single();


        if (insertError) {

            console.error(
                "❌ تعذر إنشاء بيانات العميل:",
                insertError
            );

            currentCustomer = null;

            return null;
        }


        currentCustomer =
            newCustomer;


        console.log(
            "✅ تم إنشاء بيانات العميل:",
            currentCustomer
        );


        return newCustomer;


    } catch (error) {

        console.error(
            "❌ خطأ غير متوقع في loadCustomer:",
            error
        );

        currentCustomer = null;

        return null;
    }
}


/* =========================================================
   SPLIT NAME
========================================================= */

function splitCustomerName(name) {

    const cleanName =
        (name || "").trim();


    if (!cleanName) {

        return {
            firstName: "",
            lastName: ""
        };
    }


    const parts =
        cleanName.split(/\s+/);


    const firstName =
        parts.shift() || "";


    const lastName =
        parts.join(" ");


    return {
        firstName,
        lastName
    };
}


/* =========================================================
   LOAD PROFILE HEADER
========================================================= */

function renderProfileHeader() {

    if (!currentUser) {
        return;
    }

    const email =
        currentUser.email || "";

    const customerName =
        currentCustomer?.name ||
        currentUser.user_metadata?.full_name ||
        currentUser.user_metadata?.name ||
        email.split("@")[0] ||
        "عميل عودانا";

    const avatar =
        $("profileAvatar");

    const nameElement =
        $("profileUserName");

    const emailElement =
        $("profileUserEmail");

    if (nameElement) {
        nameElement.textContent = customerName;
    }

    if (emailElement) {
        emailElement.textContent = email;
    }

    if (avatar) {
        avatar.textContent =
            customerName.charAt(0).toUpperCase();
    }

    /* -----------------------------------------
       Personal Form
    ----------------------------------------- */

    const nameInput =
        $("profileName");

    const emailInput =
        $("profileEmail");

    const phoneInput =
        $("profilePhone");

    const cityInput =
        $("profileCity");

    if (nameInput) {
        nameInput.value = customerName;
    }

    if (emailInput) {
        emailInput.value =
            currentUser.email || "";
    }

    if (phoneInput) {
        phoneInput.value =
            currentCustomer?.phone || "";
    }

    if (cityInput) {
        cityInput.value =
            currentCustomer?.city || "";
    }

    const securityEmail =
        $("securityEmail");

    if (securityEmail) {
        securityEmail.value = currentUser.email || "";
    }
}


/* =========================================================
   LOAD ORDERS
========================================================= */

async function loadOrders() {

    if (!currentUser) {
        return;
    }

    const ordersLoading = $("ordersLoading");

    // إظهار التحميل أثناء جلب الطلبات
    if (ordersLoading) {
        ordersLoading.style.display = "block";
    }

    const {
        data,
        error
    } = await profileSupabase

        .from("orders")

        .select(`
            id,
            order_number,
            customer_id,
            customer_name,
            customer_email,
            customer_phone,
            city,
            subtotal,
            shipping_fee,
            total,
            status,
            notes,
            created_at,
            updated_at,
            order_items (
                id,
                product_id,
                product_name,
                quantity,
                price,
                total,
                created_at
            )
        `)

        .eq(
            "customer_id",
            currentCustomer?.id
        )

        .order(
            "created_at",
            {
                ascending: false
            }
        );


    // انتهى التحميل سواء نجح أو فشل
    if (ordersLoading) {
        ordersLoading.style.display = "none";
    }


    if (error) {

        console.error(
            "خطأ في جلب الطلبات:",
            error
        );

        currentOrders = [];

        renderOrdersError();

        return;
    }


currentOrders =
    data || [];


/* -----------------------------------------
   إخفاء رسالة جاري تحميل الطلبات
   في قسم آخر طلب بالنظرة العامة
----------------------------------------- */

const latestOrderLoading =
    $("latestOrderLoading");

if (latestOrderLoading) {
    latestOrderLoading.style.display = "none";
}


renderOrderStats();

renderOrders();

renderLatestOrder();

populateComplaintOrders();

}

/* =========================================================
   ORDER STATS
========================================================= */

function renderOrderStats() {

    const total =
        currentOrders.length;


    const active =
        currentOrders.filter(
            order =>
                order.status === "new" ||
                order.status === "processing"
        ).length;


    /* -----------------------------------------
       Overview — إجمالي الطلبات
    ----------------------------------------- */

    const overviewOrders =
        $("overviewOrdersCount");

    if (overviewOrders) {

        overviewOrders.textContent =
            total;
    }


    /* -----------------------------------------
       الإحصائيات الأخرى إن كانت موجودة
    ----------------------------------------- */

    const totalElement =
        $("totalOrders");

    const activeElement =
        $("activeOrders");

    const navCount =
        $("ordersCount");

    if (totalElement) {

        totalElement.textContent =
            total;
    }


    if (activeElement) {

        activeElement.textContent =
            active;
    }


    if (navCount) {

        navCount.textContent =
            total;
    }
}


/* =========================================================
   RENDER ORDERS
========================================================= */

function renderOrders() {

    const container =
        $("ordersList");


    if (!container) {
        return;
    }


    if (!currentOrders.length) {

        container.innerHTML = `

            <div class="profile-empty">

                <div class="empty-icon">

                    <i class="fa-solid fa-box-open"></i>

                </div>

                <h3>
                    لا توجد طلبات حتى الآن
                </h3>

                <p>
                    عندما تقومين بإجراء أول طلب،
                    سيظهر هنا.
                </p>

                <a
                    href="menu.html"
                    class="gold-btn"
                >
                    اكتشفي المنتجات
                </a>

            </div>

        `;

        return;
    }


    container.innerHTML =
        currentOrders.map(
            renderOrderCard
        ).join("");
}


/* =========================================================
   ORDER CARD
========================================================= */

function renderOrderCard(order) {

    const items =
        order.order_items || [];


    const itemCount =
        items.reduce(
            (sum, item) =>
                sum + Number(item.quantity || 0),
            0
        );


    return `

        <article
            class="profile-order-card"
            data-order-id="${escapeHTML(order.id)}"
        >

            <div class="order-card-top">

                <div>

                    <span class="order-label">
                        رقم الطلب
                    </span>

                    <strong>
                        ${escapeHTML(
                            formatOrderNumber(order)
                        )}
                    </strong>

                </div>


                <span
                    class="order-status ${getOrderStatusClass(order.status)}"
                >
                    ${escapeHTML(
                        getOrderStatusText(order.status)
                    )}
                </span>

            </div>


            <div class="order-card-middle">

                <div>

                    <span>
                        تاريخ الطلب
                    </span>

                    <strong>
                        ${escapeHTML(
                            formatDate(order.created_at)
                        )}
                    </strong>

                </div>


                <div>

                    <span>
                        المنتجات
                    </span>

                    <strong>
                        ${itemCount}
                    </strong>

                </div>


                <div>

                    <span>
                        الإجمالي
                    </span>

                    <strong>
                        ${formatPrice(order.total)}
                    </strong>

                </div>

            </div>


            ${
                items.length
                ?
                `
                <div class="order-items-preview">

                    ${items
                        .slice(0, 3)
                        .map(item => `

                            <div class="order-item-row">

                                <span>
                                    ${escapeHTML(
                                        item.product_name
                                    )}
                                </span>

                                <span>
                                    × ${Number(
                                        item.quantity
                                    )}
                                </span>

                            </div>

                        `)
                        .join("")
                    }

                    ${
                        items.length > 3
                        ?
                        `
                        <small>
                            + ${items.length - 3}
                            منتجات أخرى
                        </small>
                        `
                        :
                        ""
                    }

                </div>
                `
                :
                ""
            }

        </article>

    `;
}


/* =========================================================
   LATEST ORDER
========================================================= */

function renderLatestOrder() {

    const container =
        $("latestOrder");


    if (!container) {
        return;
    }


    const latest =
        currentOrders[0];


    if (!latest) {

        container.innerHTML = `

            <div class="profile-empty compact">

                <i class="fa-solid fa-box-open"></i>

                <p>
                    لا توجد طلبات حتى الآن.
                </p>

            </div>

        `;

        return;
    }


    const items =
        latest.order_items || [];


    container.innerHTML = `

        <div class="latest-order-card">

            <div class="latest-order-main">

                <span>
                    ${escapeHTML(
                        formatOrderNumber(latest)
                    )}
                </span>

                <strong>
                    ${formatPrice(latest.total)}
                </strong>

            </div>


            <div class="latest-order-meta">

                <span>
                    ${escapeHTML(
                        formatDate(latest.created_at)
                    )}
                </span>

                <span
                    class="order-status ${getOrderStatusClass(latest.status)}"
                >
                    ${escapeHTML(
                        getOrderStatusText(latest.status)
                    )}
                </span>

            </div>


            <div class="latest-order-items">

                ${
                    items.length
                    ?
                    items
                        .slice(0, 3)
                        .map(item => `
                            <span>
                                ${escapeHTML(
                                    item.product_name
                                )}
                                × ${Number(
                                    item.quantity
                                )}
                            </span>
                        `)
                        .join("")
                    :
                    `<span>لا توجد تفاصيل للطلب</span>`
                }

            </div>

        </div>

    `;
}


/* =========================================================
   ORDERS ERROR
========================================================= */

function renderOrdersError() {

    const ordersList =
        $("ordersList");


    const latestOrder =
        $("latestOrder");


    if (ordersList) {

        ordersList.innerHTML = `

            <div class="profile-empty">

                <i class="fa-solid fa-circle-exclamation"></i>

                <h3>
                    تعذر تحميل الطلبات
                </h3>

                <p>
                    حدث خطأ أثناء الاتصال بقاعدة البيانات.
                </p>

            </div>

        `;
    }


    if (latestOrder) {

        latestOrder.innerHTML = `

            <div class="profile-empty compact">

                <i class="fa-solid fa-circle-exclamation"></i>

                <p>
                    تعذر تحميل آخر طلب.
                </p>

            </div>

        `;
    }
}


/* =========================================================
   LOAD FAVORITES
========================================================= */

async function loadFavorites() {

    if (!currentUser) {
        return;
    }

    const {
        count,
        error
    } = await profileSupabase

        .from("favorites")

        .select(
            "id",
            {
                count: "exact",
                head: true
            }
        )

        .eq(
            "user_id",
            currentUser.id
        );


    if (error) {

        console.error(
            "خطأ في جلب المفضلة:",
            error
        );

        currentFavoritesCount = 0;

    } else {

        currentFavoritesCount =
            count || 0;
    }


    /* -----------------------------------------
       Overview — المفضلة
    ----------------------------------------- */

    const overviewElement =
        $("overviewFavoritesCount");

    if (overviewElement) {

        overviewElement.textContent =
            currentFavoritesCount;
    }


    /* -----------------------------------------
       Sidebar — إذا كان موجودًا
    ----------------------------------------- */

    const sidebarElement =
        $("favoritesCount");

    if (sidebarElement) {

        sidebarElement.textContent =
            currentFavoritesCount;
    }
}



/* =========================================================
   LOAD ADDRESSES
========================================================= */

async function loadAddresses() {

    if (!currentUser) {
        return;
    }


    const {
        data,
        error
    } = await profileSupabase

        .from("addresses")

        .select("*")

        .eq(
            "user_id",
            currentUser.id
        )

        .order(
            "is_default",
            {
                ascending: false
            }
        )

        .order(
            "created_at",
            {
                ascending: false
            }
        );


    if (error) {

        console.error(
            "خطأ في جلب العناوين:",
            error
        );

        renderAddressesError();

        return;
    }


currentAddresses =
    data || [];


/* -----------------------------------------
   Overview + Sidebar — عدد العناوين
----------------------------------------- */

const overviewAddresses =
    $("overviewAddressesCount");

if (overviewAddresses) {

    overviewAddresses.textContent =
        currentAddresses.length;
}


const sidebarAddresses =
    $("addressesCount");

if (sidebarAddresses) {

    sidebarAddresses.textContent =
        currentAddresses.length;
}


renderAddresses();

}


/* =========================================================
   RENDER ADDRESSES
========================================================= */

function renderAddresses() {

    const container =
        $("addressesList");


    if (!container) {
        return;
    }


    if (!currentAddresses.length) {

        container.innerHTML = `

            <div class="profile-empty">

                <div class="empty-icon">

                    <i class="fa-solid fa-location-dot"></i>

                </div>

                <h3>
                    لا توجد عناوين محفوظة
                </h3>

                <p>
                    أضيفي عنوان التوصيل الخاص بك لتسهيل طلباتك القادمة.
                </p>

            </div>

        `;

        return;
    }


    container.innerHTML =
        currentAddresses
            .map(
                renderAddressCard
            )
            .join("");


    bindAddressButtons();
}


/* =========================================================
   ADDRESS CARD
========================================================= */

function renderAddressCard(address) {

    return `

        <article
            class="address-card
            ${address.is_default ? "is-default" : ""}"
        >

            <div class="address-card-top">

                <div class="address-title">

                    <i class="fa-solid fa-location-dot"></i>

                    <strong>
                        ${escapeHTML(
                            address.title
                        )}
                    </strong>

                </div>


                ${
                    address.is_default
                    ?
                    `
                    <span class="address-default">
                        العنوان الافتراضي
                    </span>
                    `
                    :
                    ""
                }

            </div>


            <div class="address-details">

                ${
                    address.recipient_name
                    ?
                    `
                    <div>
                        <span>المستلم</span>
                        <strong>
                            ${escapeHTML(
                                address.recipient_name
                            )}
                        </strong>
                    </div>
                    `
                    :
                    ""
                }


                ${
                    address.phone
                    ?
                    `
                    <div>
                        <span>الجوال</span>
                        <strong>
                            ${escapeHTML(
                                address.phone
                            )}
                        </strong>
                    </div>
                    `
                    :
                    ""
                }


                <div>

                    <span>المدينة</span>

                    <strong>
                        ${escapeHTML(
                            address.city
                        )}
                    </strong>

                </div>


                ${
                    address.district
                    ?
                    `
                    <div>

                        <span>الحي</span>

                        <strong>
                            ${escapeHTML(
                                address.district
                            )}
                        </strong>

                    </div>
                    `
                    :
                    ""
                }


                ${
                    address.street
                    ?
                    `
                    <div>

                        <span>الشارع</span>

                        <strong>
                            ${escapeHTML(
                                address.street
                            )}
                        </strong>

                    </div>
                    `
                    :
                    ""
                }


                ${
                    address.building_number
                    ?
                    `
                    <div>

                        <span>رقم المبنى</span>

                        <strong>
                            ${escapeHTML(
                                address.building_number
                            )}
                        </strong>

                    </div>
                    `
                    :
                    ""
                }


                ${
                    address.postal_code
                    ?
                    `
                    <div>

                        <span>الرمز البريدي</span>

                        <strong>
                            ${escapeHTML(
                                address.postal_code
                            )}
                        </strong>

                    </div>
                    `
                    :
                    ""
                }

            </div>


            <div class="address-actions">

                <button
                    type="button"
                    class="address-action"
                    data-address-edit="${escapeHTML(address.id)}"
                >

                    <i class="fa-regular fa-pen-to-square"></i>

                    تعديل

                </button>


                ${
                    !address.is_default
                    ?
                    `
                    <button
                        type="button"
                        class="address-action"
                        data-address-default="${escapeHTML(address.id)}"
                    >

                        <i class="fa-solid fa-star"></i>

                        جعله افتراضيًا

                    </button>
                    `
                    :
                    ""
                }


                <button
                    type="button"
                    class="address-action danger"
                    data-address-delete="${escapeHTML(address.id)}"
                >

                    <i class="fa-regular fa-trash-can"></i>

                    حذف

                </button>

            </div>

        </article>

    `;
}


/* =========================================================
   ADDRESS BUTTONS
========================================================= */

function bindAddressButtons() {

    document
        .querySelectorAll(
            "[data-address-edit]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    editAddress(
                        button.dataset.addressEdit
                    );

                }
            );

        });


    document
        .querySelectorAll(
            "[data-address-default]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    setDefaultAddress(
                        button.dataset.addressDefault
                    );

                }
            );

        });


    document
        .querySelectorAll(
            "[data-address-delete]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    deleteAddress(
                        button.dataset.addressDelete
                    );

                }
            );

        });
}


/* =========================================================
   ADDRESS ERROR
========================================================= */

function renderAddressesError() {

    const container =
        $("addressesList");


    if (!container) {
        return;
    }


    container.innerHTML = `

        <div class="profile-empty">

            <i class="fa-solid fa-circle-exclamation"></i>

            <h3>
                تعذر تحميل العناوين
            </h3>

            <p>
                حدث خطأ أثناء تحميل عناوينك.
            </p>

        </div>

    `;
}


/* =========================================================
   OPEN ADDRESS FORM
========================================================= */

function openAddressForm(address = null) {

    const panel =
        $("addressFormPanel");


    const form =
        $("addressForm");


    if (!panel || !form) {
        return;
    }


    form.reset();


    $("editingAddressId").value =
        address?.id || "";


    $("addressTitle").value =
        address?.title || "";


    $("addressRecipient").value =
        address?.recipient_name || "";


    $("addressPhone").value =
        address?.phone || "";


    $("addressCity").value =
        address?.city || "";


    $("addressDistrict").value =
        address?.district || "";


    $("addressStreet").value =
        address?.street || "";


    $("addressBuilding").value =
        address?.building_number || "";


    $("addressPostal").value =
        address?.postal_code || "";


    $("addressDefault").checked =
        Boolean(
            address?.is_default
        );


    const title =
        $("addressFormTitle");


    const eyebrow =
        $("addressFormEyebrow");


    if (address) {

        if (title) {
            title.textContent =
                "تعديل العنوان";
        }

        if (eyebrow) {
            eyebrow.textContent =
                "EDIT ADDRESS";
        }

    } else {

        if (title) {
            title.textContent =
                "إضافة عنوان جديد";
        }

        if (eyebrow) {
            eyebrow.textContent =
                "NEW ADDRESS";
        }
    }


    panel.hidden = false;
panel.classList.add("active");


    panel.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });
}


/* =========================================================
   EDIT ADDRESS
========================================================= */

function editAddress(addressId) {

    const address =
        currentAddresses.find(
            item =>
                item.id === addressId
        );


    if (!address) {
        return;
    }


    openAddressForm(address);
}


/* =========================================================
   SAVE ADDRESS
========================================================= */

async function saveAddress(event) {

    event.preventDefault();


    if (!currentUser) {
        return;
    }


    const button =
        $("saveAddressBtn");


    const message =
    $("addressFormMessage");


    const editingId =
        $("editingAddressId").value;


    const payload = {

        user_id:
            currentUser.id,

        title:
            $("addressTitle").value.trim(),

        recipient_name:
            $("addressRecipient").value.trim() || null,

        phone:
            $("addressPhone").value.trim() || null,

        city:
            $("addressCity").value.trim(),

        district:
            $("addressDistrict").value.trim() || null,

        street:
            $("addressStreet").value.trim(),

        building_number:
            $("addressBuilding").value.trim() || null,

        postal_code:
            $("addressPostal").value.trim() || null,

        is_default:
            $("addressDefault").checked

    };


    if (!payload.title ||
        !payload.city ||
        !payload.street) {

        showMessage(
            message,
            "يرجى تعبئة اسم العنوان والمدينة والشارع.",
            "error"
        );

        return;
    }


    setButtonLoading(
        button,
        true
    );


    try {

        /*
         ------------------------------------------------------
         إذا كان العنوان افتراضيًا،
         نجعل بقية عناوين المستخدم غير افتراضية.
         ------------------------------------------------------
        */

        if (payload.is_default) {

            const {
                error: defaultError
            } = await profileSupabase

                .from("addresses")

                .update({
                    is_default: false
                })

                .eq(
                    "user_id",
                    currentUser.id
                );


            if (defaultError) {
                throw defaultError;
            }
        }


        let result;


        if (editingId) {

            result =
                await profileSupabase

                    .from("addresses")

                    .update(payload)

                    .eq(
                        "id",
                        editingId
                    )

                    .eq(
                        "user_id",
                        currentUser.id
                    );

        } else {

            result =
                await profileSupabase

                    .from("addresses")

                    .insert(payload);
        }


        if (result.error) {
            throw result.error;
        }


        showMessage(
            message,
            editingId
                ? "تم تحديث العنوان بنجاح."
                : "تمت إضافة العنوان بنجاح.",
            "success"
        );


        closeAddressForm();

        await loadAddresses();

    } catch (error) {

        console.error(
            "خطأ في حفظ العنوان:",
            error
        );


        showMessage(
            message,
            "تعذر حفظ العنوان. تأكدي من إعدادات قاعدة البيانات.",
            "error"
        );

    } finally {

        setButtonLoading(
            button,
            false
        );
    }
}


/* =========================================================
   SET DEFAULT ADDRESS
========================================================= */

async function setDefaultAddress(addressId) {

    if (!currentUser) {
        return;
    }


    try {

        const {
            error: resetError
        } = await profileSupabase

            .from("addresses")

            .update({
                is_default: false
            })

            .eq(
                "user_id",
                currentUser.id
            );


        if (resetError) {
            throw resetError;
        }


        const {
            error
        } = await profileSupabase

            .from("addresses")

            .update({
                is_default: true
            })

            .eq(
                "id",
                addressId
            )

            .eq(
                "user_id",
                currentUser.id
            );


        if (error) {
            throw error;
        }


        await loadAddresses();


    } catch (error) {

        console.error(
            "خطأ في تعيين العنوان الافتراضي:",
            error
        );

        alert(
            "تعذر تعيين العنوان الافتراضي."
        );
    }
}


/* =========================================================
   DELETE ADDRESS
========================================================= */

async function deleteAddress(addressId) {

    const confirmed =
        confirm(
            "هل تريدين حذف هذا العنوان؟"
        );


    if (!confirmed) {
        return;
    }


    try {

        const {
            error
        } = await profileSupabase

            .from("addresses")

            .delete()

            .eq(
                "id",
                addressId
            )

            .eq(
                "user_id",
                currentUser.id
            );


        if (error) {
            throw error;
        }


        await loadAddresses();


    } catch (error) {

        console.error(
            "خطأ في حذف العنوان:",
            error
        );

        alert(
            "تعذر حذف العنوان."
        );
    }
}


/* =========================================================
   CLOSE ADDRESS FORM
========================================================= */

function closeAddressForm() {

    const panel =
        $("addressFormPanel");


    if (panel) {

        panel.hidden = true;
panel.classList.remove("active");
    }


    const form =
        $("addressForm");


    if (form) {

        form.reset();
    }


    $("editingAddressId").value = "";
}


/* =========================================================
   SAVE PERSONAL DATA
========================================================= */

async function savePersonalData(event) {

    event.preventDefault();

    if (!currentUser) {
        return;
    }

    const nameInput =
        $("profileName");

    const phoneInput =
        $("profilePhone");

    const cityInput =
        $("profileCity");

    const message =
        $("personalFormMessage");

    const button =
        $("savePersonalBtn");

    const name =
        nameInput?.value.trim() || "";

    const phone =
        phoneInput?.value.trim() || "";

    const city =
        cityInput?.value.trim() || "";

    if (!name) {

        showMessage(
            message,
            "يرجى كتابة الاسم.",
            "error"
        );

        return;
    }

    setButtonLoading(
        button,
        true
    );

    try {

        /*
         * إذا كان للعميل سجل موجود:
         * نحدثه.
         */

        if (currentCustomer?.id) {

            const {
                data,
                error
            } = await profileSupabase

                .from("customers")

                .update({
                    name: name,
                    phone: phone || null,
                    city: city || null,
                    email: currentUser.email || null
                })

                .eq(
                    "id",
                    currentCustomer.id
                )

                .select()
                
                .single();

            if (error) {
                throw error;
            }

            currentCustomer = data;

        } else {

            /*
             * إذا لم يكن هناك سجل للعميل،
             * نحاول إنشاءه الآن.
             */

            const {
                data,
                error
            } = await profileSupabase

                .from("customers")

                .insert({
                    user_id: currentUser.id,
                    name: name,
                    email: currentUser.email || null,
                    phone: phone || null,
                    city: city || null
                })

                .select()

                .single();

            if (error) {
                throw error;
            }

            currentCustomer = data;
        }


        /*
         * تحديث اسم المستخدم في Auth
         */

        const {
            error: authError
        } = await profileSupabase.auth.updateUser({

            data: {
                full_name: name,
                name: name
            }

        });

        if (authError) {

            console.warn(
                "تعذر تحديث بيانات Auth:",
                authError
            );
        }


        renderProfileHeader();


        showMessage(
            message,
            "تم حفظ بياناتك بنجاح.",
            "success"
        );

    } catch (error) {

        console.error(
            "خطأ في حفظ البيانات:",
            error
        );

        showMessage(
            message,
            error.message ||
            "تعذر حفظ البيانات. حاولي مرة أخرى.",
            "error"
        );

    } finally {

        setButtonLoading(
            button,
            false
        );
    }
}


/* =========================================================
   LOAD COMPLAINTS
========================================================= */

async function loadComplaints() {

    if (!currentUser) {
        return;
    }


    const {
        data,
        error
    } = await profileSupabase

        .from("complaints")

        .select(`
            id,
            user_id,
            type,
            order_id,
            subject,
            message,
            status,
            admin_reply,
            created_at,
            updated_at,
            orders (
                id,
                order_number
            )
        `)

        .eq(
            "user_id",
            currentUser.id
        )

        .order(
            "created_at",
            {
                ascending: false
            }
        );


    if (error) {

        console.error(
            "خطأ في جلب الشكاوى:",
            error
        );

        currentComplaints = [];

        renderComplaints();

        return;
    }


currentComplaints =
    data || [];


/* -----------------------------------------
   Overview — عدد الشكاوى
----------------------------------------- */

const overviewComplaints =
    $("overviewComplaintsCount");

if (overviewComplaints) {

    overviewComplaints.textContent =
        currentComplaints.length;
}


renderComplaintStats();

renderComplaints();

}


/* =========================================================
   COMPLAINT STATS
========================================================= */

function renderComplaintStats() {

    const openCount =
        currentComplaints.filter(
            complaint =>
                complaint.status === "open"
        ).length;


    const openElement =
        $("openComplaints");


    const navElement =
        $("complaintsNavCount");


    if (openElement) {

        openElement.textContent =
            openCount;
    }


    if (navElement) {

        navElement.textContent =
            currentComplaints.length;
    }
}


/* =========================================================
   COMPLAINT TYPES
========================================================= */

function getComplaintTypeText(type) {

    const types = {

        complaint: "شكوى",

        inquiry: "استفسار",

        order: "مشكلة في طلب",

        return: "استرجاع / استبدال"

    };


    return types[type] ||
        type ||
        "طلب";
}


function getComplaintStatusText(status) {

    const statuses = {

        open: "مفتوحة",

        pending: "قيد المراجعة",

        resolved: "تم الحل",

        closed: "مغلقة"

    };


    return statuses[status] ||
        status ||
        "مفتوحة";
}


/* =========================================================
   RENDER COMPLAINTS
========================================================= */

function renderComplaints() {

    const container =
        $("complaintsList");


    if (!container) {
        return;
    }


    if (!currentComplaints.length) {

        container.innerHTML = `

            <div class="profile-empty">

                <div class="empty-icon">

                    <i class="fa-regular fa-message"></i>

                </div>

                <h3>
                    لا توجد شكاوى أو استفسارات
                </h3>

                <p>
                    إذا احتجتِ أي مساعدة، نحن هنا لخدمتك.
                </p>

            </div>

        `;

        return;
    }


    container.innerHTML =
        currentComplaints
            .map(
                renderComplaintCard
            )
            .join("");
}


/* =========================================================
   COMPLAINT CARD
========================================================= */

function renderComplaintCard(complaint) {

    const orderNumber =
        complaint.orders?.order_number;


    return `

        <article class="complaint-card">

            <div class="complaint-card-top">

                <div>

                    <span>
                        ${escapeHTML(
                            getComplaintTypeText(
                                complaint.type
                            )
                        )}
                    </span>

                    <h3>
                        ${escapeHTML(
                            complaint.subject
                        )}
                    </h3>

                </div>


                <span
                    class="complaint-status"
                >
                    ${escapeHTML(
                        getComplaintStatusText(
                            complaint.status
                        )
                    )}
                </span>

            </div>


            <p class="complaint-text">

                ${escapeHTML(
                    complaint.message
                )}

            </p>


            <div class="complaint-meta">

                <span>

                    <i class="fa-regular fa-calendar"></i>

                    ${escapeHTML(
                        formatDate(
                            complaint.created_at
                        )
                    )}

                </span>


                ${
                    orderNumber
                    ?
                    `
                    <span>

                        <i class="fa-solid fa-box"></i>

                        الطلب:
                        ${escapeHTML(
                            orderNumber
                        )}

                    </span>
                    `
                    :
                    ""
                }

            </div>


            ${
                complaint.admin_reply
                ?
                `
                <div class="admin-reply">

                    <strong>
                        رد عودانا
                    </strong>

                    <p>
                        ${escapeHTML(
                            complaint.admin_reply
                        )}
                    </p>

                </div>
                `
                :
                ""
            }

        </article>

    `;
}


/* =========================================================
   POPULATE COMPLAINT ORDERS
========================================================= */

function populateComplaintOrders() {

    const select =
        $("complaintOrderId");


    if (!select) {
        return;
    }


    select.innerHTML = `

        <option value="">
            بدون طلب محدد
        </option>

    `;


    currentOrders.forEach(order => {

        const option =
            document.createElement(
                "option"
            );


        option.value =
            order.id;


        option.textContent =
            `${formatOrderNumber(order)} — ${formatPrice(order.total)}`;


        select.appendChild(
            option
        );

    });
}


/* =========================================================
   SAVE COMPLAINT
========================================================= */

async function saveComplaint(event) {

    event.preventDefault();


    if (!currentUser) {
        return;
    }


    const button =
    $("saveComplaintBtn");


    const messageBox =
        $("complaintMessageBox");


    const payload = {

        user_id:
            currentUser.id,

        type:
            $("complaintType").value,

        order_id:
            $("complaintOrderId").value || null,

        subject:
            $("complaintSubject")
                .value
                .trim(),

        message:
            $("complaintMessage")
                .value
                .trim(),

        status:
            "open"

    };


    if (!payload.subject ||
        !payload.message) {

        showMessage(
            messageBox,
            "يرجى كتابة عنوان الموضوع والتفاصيل.",
            "error"
        );

        return;
    }


    setButtonLoading(
        button,
        true
    );


    try {

        const {
            error
        } = await profileSupabase

            .from("complaints")

            .insert(payload);


        if (error) {
            throw error;
        }


        showMessage(
            messageBox,
            "تم إرسال طلبك بنجاح، وسيتولى فريق عودانا مراجعته.",
            "success"
        );


        $("complaintForm").reset();


       $("complaintFormPanel").hidden = true;
$("complaintFormPanel").classList.remove("active");


        await loadComplaints();


    } catch (error) {

        console.error(
            "خطأ في إرسال الشكوى:",
            error
        );


        showMessage(
            messageBox,
            "تعذر إرسال الطلب. حاولي مرة أخرى.",
            "error"
        );

    } finally {

        setButtonLoading(
            button,
            false
        );
    }
}


/* =========================================================
   CHANGE PASSWORD
========================================================= */

async function changePassword(event) {

    event.preventDefault();


    const newPassword =
        $("newPassword").value;


    const confirmPassword =
        $("confirmPassword").value;


    const message =
        $("passwordMessage");


    const button =
        $("changePasswordBtn");


    if (newPassword.length < 6) {

        showMessage(
            message,
            "كلمة المرور يجب أن تحتوي على 6 أحرف أو أكثر.",
            "error"
        );

        return;
    }


    if (newPassword !== confirmPassword) {

        showMessage(
            message,
            "كلمتا المرور غير متطابقتين.",
            "error"
        );

        return;
    }


    setButtonLoading(
        button,
        true
    );


    try {

        const {
            error
        } = await profileSupabase.auth.updateUser({

            password:
                newPassword

        });


        if (error) {
            throw error;
        }


        $("passwordForm").reset();


        showMessage(
            message,
            "تم تغيير كلمة المرور بنجاح.",
            "success"
        );


    } catch (error) {

        console.error(
            "خطأ في تغيير كلمة المرور:",
            error
        );


        showMessage(
            message,
            error.message ||
            "تعذر تغيير كلمة المرور.",
            "error"
        );

    } finally {

        setButtonLoading(
            button,
            false
        );
    }
}


/* =========================================================
   NAVIGATION
========================================================= */

function openProfileSection(sectionName) {

    if (!sectionName) {
        return;
    }


    document
        .querySelectorAll(
            ".profile-nav-item"
        )
        .forEach(button => {

            button.classList.toggle(
                "active",
                button.dataset.section === sectionName
            );

        });


    document
        .querySelectorAll(
            ".profile-section"
        )
        .forEach(section => {

            section.classList.toggle(
                "active",
                section.id ===
                `section-${sectionName}`
            );

        });


    window.scrollTo({

        top: 0,

        behavior: "smooth"

    });
}


/* =========================================================
   NAVIGATION EVENTS
========================================================= */

function setupNavigation() {

    /*
     * القائمة الجانبية
     */

    document
        .querySelectorAll(".profile-nav-item")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    openProfileSection(
                        button.dataset.section
                    );

                }
            );

        });


    /*
     * الأزرار السريعة داخل الصفحة
     */

    document
        .querySelectorAll("[data-go-section]")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    openProfileSection(
                        button.dataset.goSection
                    );

                }
            );

        });
}


/* =========================================================
   ADDRESS EVENTS
========================================================= */

function setupComplaintEvents() {

    const newComplaintBtn = $("newComplaintBtn");
    const cancelComplaintBtn = $("cancelComplaintBtn");
    const complaintForm = $("complaintForm");
    const panel = $("complaintFormPanel");

    // زر إضافة شكوى
    if (newComplaintBtn && panel) {

        newComplaintBtn.addEventListener("click", () => {

            panel.hidden = false;
            panel.classList.add("active");

            panel.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

        });

    }


    // زر إلغاء
    if (cancelComplaintBtn && panel) {

        cancelComplaintBtn.addEventListener("click", () => {

            panel.hidden = true;
            panel.classList.remove("active");

            if (complaintForm) {
                complaintForm.reset();
            }

        });

    }


    // إرسال الشكوى
    if (complaintForm) {

        complaintForm.addEventListener("submit", saveComplaint);

    }

}

/* =========================================================
   ADDRESS EVENTS
========================================================= */

function setupAddressEvents() {

    const newButton =
        $("newAddressBtn");

    const cancelButton =
        $("cancelAddressBtn");

    const form =
        $("addressForm");


    /* فتح نموذج إضافة عنوان */

    if (newButton) {

        newButton.addEventListener(
            "click",
            () => {

                openAddressForm();

            }
        );

    }


    /* إلغاء النموذج */

    if (cancelButton) {

        cancelButton.addEventListener(
            "click",
            () => {

                closeAddressForm();

            }
        );

    }


    /* حفظ العنوان */

    if (form) {

        form.addEventListener(
            "submit",
            saveAddress
        );

    }

}
/* =========================================================
   PERSONAL EVENTS
========================================================= */

function setupPersonalEvents() {

    const form =
        $("personalDataForm");

    if (form) {

        form.addEventListener(
            "submit",
            savePersonalData
        );
    }
}



/* =========================================================
   SECURITY EVENTS
========================================================= */

function setupSecurityEvents() {

    const form =
        $("passwordForm");


    if (form) {

        form.addEventListener(
            "submit",
            changePassword
        );
    }
}


/* =========================================================
   LOGOUT
========================================================= */

async function logoutProfile() {

    const confirmed =
        confirm(
            "هل تريدين تسجيل الخروج من حسابك؟"
        );


    if (!confirmed) {
        return;
    }


    const {
        error
    } = await profileSupabase.auth.signOut();


    if (error) {

        console.error(
            "خطأ في تسجيل الخروج:",
            error
        );


        alert(
            "حدث خطأ أثناء تسجيل الخروج."
        );

        return;
    }


    window.location.href =
        "index.html";
}


/* =========================================================
   LOGOUT EVENT
========================================================= */

function setupLogout() {

    const button =
        $("profileLogoutBtn");

    if (button) {

        button.addEventListener(
            "click",
            logoutProfile
        );
    }
}



/* =========================================================
   AUTH STATE
========================================================= */

function setupAuthListener() {

    profileSupabase.auth.onAuthStateChange(
        (event, session) => {

            if (
                event === "SIGNED_OUT" ||
                !session
            ) {

                window.location.href =
                    "login.html";
            }

        }
    );
}


/* =========================================================
   LOAD EVERYTHING
========================================================= */

async function loadProfile() {

    currentUser =
        await getCurrentProfileUser();


    /*
     * المستخدم غير مسجل دخول
     */

    if (!currentUser) {

        window.location.href =
            "login.html";

        return;
    }


    console.log(
        "OUDANA current user:",
        currentUser.id
    );


    /*
     * جلب بيانات العميل
     *
     * إذا لم يوجد سجل customers
     * لا نوقف الصفحة.
     */

    await loadCustomer();


    /*
     * عرض بيانات الحساب
     */

    renderProfileHeader();


    /*
     * تحميل بقية البيانات
     */

    await Promise.all([

        loadOrders(),

        loadAddresses(),

        loadComplaints(),

        loadFavorites()

    ]);


    console.log(
        "OUDANA profile loaded successfully."
    );
}



/* =========================================================
   CART DRAWER
========================================================= */

function setupProfileCart() {

    const cartButton =
        $("profileCartBtn");


    const closeButton =
        $("profileCartClose");


    const overlay =
        $("profileCartOverlay");


    const drawer =
        $("profileCartDrawer");


    if (!cartButton ||
        !drawer ||
        !overlay) {

        return;
    }


    function openCart() {

        drawer.classList.add("active");

        overlay.classList.add("active");

        drawer.setAttribute(
            "aria-hidden",
            "false"
        );

        renderProfileCart();
    }


    function closeCart() {

        drawer.classList.remove("active");

        overlay.classList.remove("active");

        drawer.setAttribute(
            "aria-hidden",
            "true"
        );
    }


    cartButton.addEventListener(
        "click",
        openCart
    );


    if (closeButton) {

        closeButton.addEventListener(
            "click",
            closeCart
        );
    }


    overlay.addEventListener(
        "click",
        closeCart
    );


    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Escape"
            ) {

                closeCart();

            }

        }
    );


    updateProfileCartCount();

    window.addEventListener(
        "storage",
        updateProfileCartCount
    );
}


/* =========================================================
   CART COUNT
========================================================= */

function getProfileCartItems() {

    /*
     ------------------------------------------------------
     نحاول قراءة السلة من أكثر من اسم شائع حتى لا
     تتعارض الصفحة مع cart.js الحالي.
     ------------------------------------------------------
    */

    const possibleKeys = [

        "oudana_cart",

        "cart",

        "cartItems",

        "OUDANA_CART"

    ];


    for (
        const key of possibleKeys
    ) {

        try {

            const raw =
                localStorage.getItem(key);


            if (!raw) {
                continue;
            }


            const parsed =
                JSON.parse(raw);


            if (Array.isArray(parsed)) {

                return parsed;
            }

        } catch (error) {

            console.warn(
                `تعذر قراءة السلة من ${key}`,
                error
            );

        }

    }


    return [];
}


/* =========================================================
   CART COUNT UPDATE
========================================================= */

function updateProfileCartCount() {

    const element =
        $("profileCartCount");


    if (!element) {
        return;
    }


    const items =
        getProfileCartItems();


    const count =
        items.reduce(
            (sum, item) =>
                sum +
                Number(
                    item.quantity ||
                    item.qty ||
                    1
                ),
            0
        );


    element.textContent =
        count;
}


/* =========================================================
   CART RENDER
========================================================= */

function renderProfileCart() {

    const container =
        $("profileCartContent");


    if (!container) {
        return;
    }


    const items =
        getProfileCartItems();


    if (!items.length) {

        container.innerHTML = `

            <div class="profile-empty compact">

                <i class="fa-solid fa-bag-shopping"></i>

                <h3>
                    سلتك فارغة
                </h3>

                <p>
                    أضيفي منتجاتك المفضلة من متجر عودانا.
                </p>

                <a
                    href="menu.html"
                    class="gold-btn"
                >
                    اكتشفي المنتجات
                </a>

            </div>

        `;

        updateProfileCartCount();

        return;
    }


    container.innerHTML = `

        <div class="profile-cart-items">

            ${
                items.map(item => `

                    <div class="profile-cart-item">

                        ${
                            item.image ||
                            item.image_url
                            ?
                            `
                            <img
                                src="${escapeHTML(
                                    item.image ||
                                    item.image_url
                                )}"
                                alt="${escapeHTML(
                                    item.name ||
                                    item.product_name ||
                                    "منتج"
                                )}"
                            >
                            `
                            :
                            `
                            <div class="profile-cart-item-placeholder">
                                <i class="fa-solid fa-box"></i>
                            </div>
                            `
                        }


                        <div>

                            <strong>
                                ${escapeHTML(
                                    item.name ||
                                    item.product_name ||
                                    "منتج"
                                )}
                            </strong>

                            <span>
                                × ${Number(
                                    item.quantity ||
                                    item.qty ||
                                    1
                                )}
                            </span>

                        </div>

                    </div>

                `).join("")
            }

        </div>

        <a
            href="cart.html"
            class="gold-btn profile-cart-view-btn"
        >
            الذهاب إلى السلة
            <i class="fa-solid fa-arrow-left"></i>
        </a>

    `;


    updateProfileCartCount();
}


/* =========================================================
   OVERVIEW STAT CARDS
========================================================= */

function setupOverviewStatCards() {

    const statCards =
        document.querySelectorAll(
            ".profile-stat-card"
        );


    if (!statCards.length) {
        return;
    }


    statCards.forEach((card, index) => {

        /* نجعل البطاقة قابلة للنقر */

        card.style.cursor = "pointer";


        card.addEventListener(
            "click",
            () => {

                /*
                 * 0 = الطلبات
                 * 1 = العناوين
                 * 2 = الشكاوى
                 * 3 = المفضلة
                 */

                if (index === 0) {

                    openProfileSection(
                        "orders"
                    );

                    return;
                }


                if (index === 1) {

                    openProfileSection(
                        "addresses"
                    );

                    return;
                }


                if (index === 2) {

                    openProfileSection(
                        "complaints"
                    );

                    return;
                }


                if (index === 3) {

                    window.location.href =
                        "favorites.html";

                    return;
                }

            }
        );

    });
}



/* =========================================================
   PAGE INITIALIZATION
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async () => {
         
        setupNavigation();

        setupOverviewStatCards();

        setupAddressEvents();

        setupComplaintEvents();

        setupPersonalEvents();

        setupSecurityEvents();

        setupLogout();

        setupAuthListener();

        setupProfileCart();

        await loadProfile();

    }
);