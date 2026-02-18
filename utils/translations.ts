export type Language = 'en' | 'es' | 'bn';

export const translations = {
    en: {
        app: {
            title: "Rescue Pulse",
            tagline: "Community Emergency Response"
        },
        nav: {
            feed: "Feed",
            map: "Map",
            myRequests: "My Requests",
            messages: "Messages",
            home: "Home",
            post: "Post",
            profile: "Profile",
            login: "Login",
            logout: "Logout",
            create: "Request Help"
        },
        filter: {
            nearby: "Nearby Alerts",
            radius: "Radius",
            allDistances: "All distances",
            km: "km"
        },
        common: {
            loading: "Loading...",
            save: "Save",
            cancel: "Cancel",
            delete: "Delete",
            edit: "Edit",
            view: "View",
            processing: "Processing...",
            searching: "Searching...",
            post: "Post",
            back: "Back",
            remove: "Remove",
            saving: "Saving...",
            sendMessage: "Send Message"
        },
        alert: {
            status: {
                active: "Active",
                resolved: "Resolved",
                responding: "Responding"
            },
            severity: {
                low: "Low",
                medium: "Medium",
                high: "High",
                critical: "Critical"
            },
            actions: {
                respond: "I Can Help",
                responding: "On My Way",
                resolved: "Mark Resolved",
                safe: "I Am Safe Now",
                comments: "Comments",
                askAi: "Ask AI Advice",
                findPlaces: "Find Places"
            },
            broadcasting: "Alert Broadcasting!",
            broadcastingSubtitle: "Help is being requested from nearby community members.",
            liveStatus: "Live Status",
            anonymous: "Anonymous Request",
            location: "Location",
            taskDifficulty: {
                easy: "Easy Task",
                medium: "Medium Task",
                hard: "Hard Task"
            },
            label: {
                emergency: "Emergency",
                request: "Request"
            },
            aiAdvice: "AI Safety Advice",
            noAdvice: "No specific advice found.",
            nearbyLocations: "Nearby Help Locations",
            locationShared: "Location Shared",
            respondingCount: "Responding",
            deleteConfirm: {
                title: "Delete this post?",
                text: "This action cannot be undone. All comments will also be removed."
            },
            comments: {
                empty: "No comments yet. Start the discussion.",
                placeholder: "Ask for details or offer advice...",
                loading: "Loading comments...",
                emptyShare: "No comments yet. Be the first to share!"
            },
            thread: "Thread"
        },
        profile: {
            title: "User Profile",
            myProfile: "My Profile",
            manageIdentity: "Manage your identity & skills",
            communityMember: "Community Member",
            tabs: {
                details: "Details",
                history: "History"
            },
            activity: {
                title: "Recent Activity",
                loading: "Loading history...",
                empty: "No recent activity found.",
                postedAlert: "Posted an Alert",
                commented: "Commented",
                upvoted: "Upvoted"
            },
            displayName: "Display Name",
            avatarUrl: "Avatar URL",
            random: "Random",
            avatarHelp: "Enter an image URL or a Google Drive sharing link.",
            skillsLabel: "Skills & Certifications",
            skillsPlaceholder: "E.g. CPR Certified, Mechanic, Fire Safety Training...",
            skillsHelp: "Separate multiple skills with commas. These will be displayed as badges on your profile.",
            saveChanges: "Save Changes",
            sendMessage: "Send Message",
            noSkills: "User has not listed any specific skills yet."
        },
        feed: {
            title: "Community Feed",
            empty: {
                nearbyTitle: "Quiet in the neighborhood",
                nearbyText: "No active requests nearby at the moment.",
                myRequestsTitle: "No active requests",
                myRequestsText: "You haven't posted any help requests yet."
            }
        },
        auth: {
            signIn: "Sign In",
            email: "Email",
            password: "Password",
            noAccount: "Don't have an account?",
            signUp: "Sign Up",
            hasAccount: "Already have an account?"
        }
    },
    es: {
        app: {
            title: "Pulso de Rescate",
            tagline: "Respuesta de Emergencia Comunitaria"
        },
        nav: {
            feed: "Inicio",
            map: "Mapa",
            myRequests: "Mis Solicitudes",
            messages: "Mensajes",
            home: "Inicio",
            post: "Publicar",
            profile: "Perfil",
            login: "Iniciar Sesión",
            logout: "Cerrar Sesión",
            create: "Pedir Ayuda"
        },
        filter: {
            nearby: "Alertas Cercanas",
            radius: "Radio",
            allDistances: "Todas las distancias",
            km: "km"
        },
        common: {
            loading: "Cargando...",
            save: "Guardar",
            cancel: "Cancelar",
            delete: "Eliminar",
            edit: "Editar",
            view: "Ver",
            processing: "Procesando...",
            searching: "Buscando...",
            post: "Publicar",
            back: "Atrás",
            remove: "Eliminar",
            saving: "Guardando...",
            sendMessage: "Enviar Mensaje"
        },
        alert: {
            status: {
                active: "Activo",
                resolved: "Resuelto",
                responding: "Respondiendo"
            },
            severity: {
                low: "Baja",
                medium: "Media",
                high: "Alta",
                critical: "Crítica"
            },
            actions: {
                respond: "Puedo Ayudar",
                responding: "En Camino",
                resolved: "Marcar Resuelto",
                safe: "Ahora Estoy A Salvo",
                comments: "Comentarios",
                askAi: "Pedir Consejo IA",
                findPlaces: "Buscar Lugares"
            },
            broadcasting: "¡Alerta Transmitiendo!",
            broadcastingSubtitle: "Se solicita ayuda a los miembros de la comunidad cercanos.",
            liveStatus: "Estado en Vivo",
            anonymous: "Solicitud Anónima",
            location: "Ubicación",
            taskDifficulty: {
                easy: "Tarea Fácil",
                medium: "Tarea Media",
                hard: "Tarea Difícil"
            },
            label: {
                emergency: "Emergencia",
                request: "Solicitud"
            },
            aiAdvice: "Consejo de Seguridad IA",
            noAdvice: "No se encontró consejo específico.",
            nearbyLocations: "Ubicaciones de Ayuda Cercanas",
            locationShared: "Ubicación Compartida",
            respondingCount: "Respondiendo",
            deleteConfirm: {
                title: "¿Eliminar esta publicación?",
                text: "Esta acción no se puede deshacer. Todos los comentarios también se eliminarán."
            },
            comments: {
                empty: "Aún no hay comentarios. Inicia la discusión.",
                placeholder: "Pide detalles u ofrece consejo...",
                loading: "Cargando comentarios...",
                emptyShare: "Aún no hay comentarios. ¡Sé el primero en compartir!"
            },
            thread: "Hilo"
        },
        profile: {
            title: "Perfil de Usuario",
            myProfile: "Mi Perfil",
            manageIdentity: "Gestiona tu identidad y habilidades",
            communityMember: "Miembro de la Comunidad",
            tabs: {
                details: "Detalles",
                history: "Historial"
            },
            activity: {
                title: "Actividad Reciente",
                empty: "No se encontró actividad reciente.",
                created: "Publicó una Alerta",
                commented: "Comentó",
                upvoted: "Votó Positivo"
            }
        },
        feed: {
            title: "Feed Comunitario",
            empty: {
                nearbyTitle: "Tranquilo en el vecindario",
                nearbyText: "No hay solicitudes activas cerca en este momento.",
                myRequestsTitle: "Sin solicitudes activas",
                myRequestsText: "Aún no has publicado ninguna solicitud de ayuda."
            }
        },
        auth: {
            signIn: "Iniciar Sesión",
            email: "Correo Electrónico",
            password: "Contraseña",
            noAccount: "¿No tienes cuenta?",
            signUp: "Regístrate",
            hasAccount: "¿Ya tienes cuenta?"
        }
    },
    bn: {
        app: {
            title: "রিসকিউ পালস",
            tagline: "কমিউনিটি ইমার্জেন্সি রেসপন্স"
        },
        nav: {
            feed: "ফিড",
            map: "ম্যাপ",
            myRequests: "আমার অনুরোধ",
            messages: "বার্তা",
            home: "হোম",
            post: "পোস্ট করুন",
            profile: "প্রোফাইল",
            login: "লগইন",
            logout: "লগআউট",
            create: "সাহায্য অনুরোধ"
        },
        filter: {
            nearby: "কাছাকাছি সতর্কতা",
            radius: "ব্যাসার্ধ",
            allDistances: "সব দূরত্ব",
            km: "কিমি"
        },
        common: {
            loading: "লোড হচ্ছে...",
            save: "সংরক্ষণ",
            cancel: "বাতিল",
            delete: "মুছুন",
            edit: "সম্পাদনা",
            view: "দেখুন",
            processing: "প্রক্রিয়াধীন...",
            searching: "অনুসন্ধান...",
            post: "পোস্ট",
            back: "ফিরে যান",
            remove: "অপসারণ",
            saving: "সংরক্ষণ করা হচ্ছে...",
            sendMessage: "বার্তা পাঠান"
        },
        alert: {
            status: {
                active: "সক্রিয়",
                resolved: "মীমাংসিত",
                responding: "সাড়া দিচ্ছে"
            },
            severity: {
                low: "কম",
                medium: "মাঝারি",
                high: "উচ্চ",
                critical: "গুরুতর"
            },
            actions: {
                respond: "আমি সাহায্য করতে পারি",
                responding: "আসছি",
                resolved: "মীমাংসিত হিসেবে চিহ্নিত করুন",
                safe: "আমি এখন নিরাপদ",
                comments: "মন্তব্য",
                askAi: "এআই পরামর্শ নিন",
                findPlaces: "স্থান খুঁজুন"
            },
            broadcasting: "সতর্কতা সম্প্রচার করা হচ্ছে!",
            broadcastingSubtitle: "কাছাকাছি সম্প্রদায়ের সদস্যদের কাছে সাহায্য চাওয়া হচ্ছে।",
            liveStatus: "লাইভ স্ট্যাটাস",
            anonymous: "বেনামী অনুরোধ",
            location: "অবস্থান",
            taskDifficulty: {
                easy: "সহজ কাজ",
                medium: "মাঝারি কাজ",
                hard: "কঠিন কাজ"
            },
            label: {
                emergency: "জরুরী",
                request: "অনুরোধ"
            },
            aiAdvice: "এআই সুরক্ষা পরামর্শ",
            noAdvice: "কোন নির্দিষ্ট পরামর্শ পাওয়া যায়নি।",
            nearbyLocations: "কাছাকাছি সাহায্যের স্থান",
            locationShared: "অবস্থান শেয়ার করা হয়েছে",
            respondingCount: "সাড়া দিচ্ছে",
            deleteConfirm: {
                title: "এই পোস্টটি মুছবেন?",
                text: "এই কাজটি পূর্বাবস্থায় ফেরানো যাবে না। সমস্ত মন্তব্যও মুছে ফেলা হবে।"
            },
            comments: {
                empty: "এখনও কোন মন্তব্য নেই। আলোচনা শুরু করুন।",
                placeholder: "বিস্তারিত জানতে বা পরামর্শ দিন...",
                loading: "মন্তব্য লোড হচ্ছে...",
                emptyShare: "এখনও কোন মন্তব্য নেই। প্রথমে শেয়ার করুন!"
            },
            thread: "থ্রেড"
        },
        profile: {
            title: "ব্যবহারকারী প্রোফাইল",
            myProfile: "আমার প্রোফাইল",
            manageIdentity: "আপনার পরিচয় এবং দক্ষতা পরিচালনা করুন",
            communityMember: "কমিউনিটি সদস্য",
            tabs: {
                details: "বিস্তারিত",
                history: "ইতিহাস"
            },
            activity: {
                title: "সাম্প্রতিক কার্যকলাপ",
                loading: "ইতিহাস লোড হচ্ছে...",
                empty: "কোন সাম্প্রতিক কার্যকলাপ পাওয়া যায়নি।",
                postedAlert: "একটি সতর্কতা পোস্ট করেছেন",
                commented: "মন্তব্য করেছেন",
                upvoted: "ভোট দিয়েছেন"
            },
            displayName: "প্রদর্শনের নাম",
            avatarUrl: "অবতার ইউআরএল",
            random: "র্যান্ডম",
            avatarHelp: "একটি ছবির ইউআরএল বা গুগল ড্রাইভ শেয়ারিং লিঙ্ক দিন।",
            skillsLabel: "দক্ষতা এবং শংসাপত্র",
            skillsPlaceholder: "যেমন: সিপিআর সার্টিফাইড, মেকানিক...",
            skillsHelp: "কমা দিয়ে একাধিক দক্ষতা আলাদা করুন। এগুলি আপনার প্রোফাইলে ব্যাজ হিসেবে দেখানো হবে।",
            saveChanges: "পরিবর্তনগুলি সংরক্ষণ করুন",
            sendMessage: "বার্তা পাঠান",
            noSkills: "ব্যবহারকারী এখনও কোন নির্দিষ্ট দক্ষতা তালিকাভুক্ত করেননি।"
        },
        feed: {
            title: "কমিউনিটি ফিড",
            empty: {
                nearbyTitle: "এলাকায় শান্ত",
                nearbyText: "এই মুহূর্তে কাছাকাছি কোনো সক্রিয় অনুরোধ নেই।",
                myRequestsTitle: "কোনো সক্রিয় অনুরোধ নেই",
                myRequestsText: "আপনি এখনও কোনো সাহায্যের অনুরোধ পোস্ট করেননি।"
            }
        },
        auth: {
            signIn: "সাইন ইন",
            email: "ইমেল",
            password: "পাসওয়ার্ড",
            noAccount: "অ্যাকাউন্ট নেই?",
            signUp: "সাইন আপ",
            hasAccount: "ইতিমধ্যে অ্যাকাউন্ট আছে?"
        }
    }
};
