
/* =========================================================
   OUDANA AUTH
   Customer Session + Header Account
========================================================= */

const OUDANA_SUPABASE_URL =
    "https://gpncttjpcucnbaatwjoy.supabase.co";

const OUDANA_SUPABASE_KEY =
    "sb_publishable_emYCVcv_b9gLa62n3D1pPg_lI5xRnD4";


const oudanaAuth =
    supabase.createClient(
        OUDANA_SUPABASE_URL,
        OUDANA_SUPABASE_KEY
    );


/* =========================================================
   GET CURRENT USER
========================================================= */

async function getOudanaUser() {

    const {
        data,
        error
    } = await oudanaAuth.auth.getUser();

    if (error || !data?.user) {
        return null;
    }

    return data.user;
}


/* =========================================================
   GET USER FIRST LETTER
========================================================= */

function getUserInitial(user) {

    if (!user) {
        return "";
    }


    const fullName =
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.email ||
        "";


    const cleanName =
        fullName.trim();


    if (!cleanName) {
        return "";
    }


    return cleanName
        .charAt(0)
        .toUpperCase();
}


/* =========================================================
   HEADER ACCOUNT
========================================================= */

async function updateHeaderAccount() {

    const accountLink =
    document.getElementById("accountBtn");


    if (!accountLink) {
        return;
    }


    const user =
        await getOudanaUser();


    /* ================================================
       NOT LOGGED IN
    ================================================= */

    if (!user) {

        accountLink.href =
            "login.html";

        accountLink.innerHTML = `
            <i class="fa-regular fa-user"></i>
        `;

        accountLink.classList.remove(
            "user-account"
        );

        return;
    }


    /* ================================================
       LOGGED IN
    ================================================= */

    const initial =
    getUserInitial(user);


accountLink.href =
    "profile.html";


accountLink.classList.add(
    "user-account"
);


accountLink.innerHTML = `
    <span class="user-initial">
        ${initial}
    </span>
`;

   
}


/* =========================================================
   AUTH STATE LISTENER
========================================================= */

oudanaAuth.auth.onAuthStateChange(
    (event, session) => {

        updateHeaderAccount();

    }
);


/* =========================================================
   INITIAL LOAD
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        updateHeaderAccount();

    }
);

