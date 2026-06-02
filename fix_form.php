<?php
$c = file_get_contents('resources/js/Pages/Subscription.tsx');
$replacement = <<<EOT
                           {/* Advisory banner: company creates credentials */}
                           <div className={`flex items-start gap-4 p-5 rounded-2xl border-2 border-dashed \${isDark ? 'bg-brand-yellow/5 border-brand-yellow/30' : 'bg-amber-50 border-amber-200'}`}>
                              <ShieldCheck size={22} className="text-amber-500 shrink-0 mt-0.5" />
                              <div>
                                 <p className={`text-sm font-black \${isDark ? 'text-amber-300' : 'text-amber-800'}`}>
                                    {isAr ? "كيف تعمل عملية الانضمام؟" : "How does the onboarding work?"}
                                 </p>
                                 <p className={`text-xs font-medium mt-1 leading-relaxed \${isDark ? 'text-amber-400/80' : 'text-amber-700'}`}>
                                    {isAr
                                       ? "ستقوم الشركة بمراجعة طلبك، والتواصل معك، ثم إنشاء حسابك وإرسال بيانات الدخول إلى بريدك الإلكتروني — لا حاجة لإنشاء كلمة مرور الآن."
                                       : "Our team will review your request, contact you, then create your account and send login credentials to your email — no need to set a password now."
                                    }
                                 </p>
                              </div>
                           </div>

                           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                              <FormInput
                                 theme={theme}
                                 label={isAr ? "البريد الإلكتروني للمسؤول" : "Admin Email"}
                                 id="email"
                                 type="email"
                                 icon={<Mail size={18}/>}
                                 placeholder="admin@school.com"
                                 required
                                 value={data.email}
                                 onChange={(e: any) => setData("email", e.target.value)}
                                 error={errors.email}
                                 helpText={isAr ? "ستصلك بيانات الدخول على هذا البريد" : "Your login credentials will be sent here"}
                                 dir="ltr"
                              />
                           </div>
                        </div>

                        {/* Step 2: School Info */}
EOT;

$c = preg_replace('/\{\/\* Advisory banner: company creates credentials \*\/\}.*?\{\/\* Step 2: School Info \*\/\}/s', $replacement, $c);
file_put_contents('resources/js/Pages/Subscription.tsx', $c);
