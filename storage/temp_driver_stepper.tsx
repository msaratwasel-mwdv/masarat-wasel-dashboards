              {/* Header */}
              <div className={`px-8 pt-8 pb-6 border-b ${isDark ? "border-gray-800" : "border-gray-100"}`}>
                <h2 className={`text-2xl font-bold ${isDark ? "text-white" : "text-brand-navy"}`}>
                  {isEditing ? (isRTL ? "تعديل بيانات السائق" : "Edit Driver Details") : (isRTL ? "تسجيل بيانات سائق جديد" : "Register New Driver")}
                </h2>
                
                {/* Stepper */}
                <div className="mt-6 relative flex items-center justify-between px-10">
                  <div className="absolute left-10 right-10 top-1/2 -translate-y-1/2 h-1 bg-gray-200 rounded-full z-0"></div>
                  <div className="absolute left-10 top-1/2 -translate-y-1/2 h-1 bg-brand-yellow rounded-full z-0 transition-all duration-300" style={{ width: currentStep === 1 ? '0%' : '100%' }}></div>
                  <div className={`relative w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow z-10 ${currentStep >= 1 ? 'bg-brand-yellow text-brand-dark' : 'bg-gray-200 text-gray-500'}`}>1</div>
                  <div className={`relative w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow z-10 ${currentStep >= 2 ? 'bg-brand-yellow text-brand-dark' : 'bg-gray-200 text-gray-500'}`}>2</div>
                </div>
                <div className="flex justify-between px-4 mt-2 text-xs font-bold text-gray-500">
                  <span>{isRTL ? 'البيانات الشخصية' : 'Personal Details'}</span>
                  <span>{isRTL ? 'بيانات الاتصال والرخصة' : 'Contact & License'}</span>
                </div>
              </div>

              <form onSubmit={submit} className="flex flex-col">
                <div className="p-8 space-y-8">
                  
                  {/* Step 1 */}
                  {currentStep === 1 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                      
                      {/* Photo Upload Section */}
                      <div className={`flex items-start gap-6 ${isRTL ? "flex-row-reverse" : ""}`}>
                        <div className="relative w-24 h-24 rounded-2xl bg-gray-100 flex items-center justify-center border border-gray-200 flex-shrink-0 overflow-visible">
                          <div className="w-full h-full rounded-2xl overflow-hidden flex items-center justify-center bg-gray-50">
                            {data.image ? (
                              <img src={URL.createObjectURL(data.image)} alt="Preview" className="w-full h-full object-cover" />
                            ) : previewImage ? (
                              <img src={previewImage} alt="Current" className="w-full h-full object-cover" />
                            ) : (
                              <svg className="w-10 h-10 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                        </div>
                        
                        <div className={`flex-1 ${isRTL ? "text-right" : "text-left"}`}>
                          <h4 className={`font-bold ${isDark ? "text-gray-200" : "text-gray-800"}`}>
                            {isRTL ? "صورة الملف الشخصي للسائق" : "Driver Profile Image"}
                          </h4>
                          <div className={`flex gap-3 mt-3 ${isRTL ? "flex-row-reverse justify-end" : ""}`}>
                            <label className={`cursor-pointer px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${isDark ? "bg-brand-navy border border-gray-600 text-white hover:bg-gray-800" : "bg-brand-navy text-white hover:bg-opacity-90"}`}>
                              {isRTL ? "رفع صورة" : "Upload Photo"}
                              <input type="file" className="hidden" accept="image/*" onChange={(e) => setData("image", e.target.files?.[0] || null)} />
                            </label>
                          </div>
                          <InputError message={errors.image} className="mt-2" />
                        </div>
                      </div>

                      {/* AR Names Grid */}
                      <div>
                        <h4 className={`text-sm font-bold border-b pb-2 mb-4 ${isDark ? "border-gray-700 text-gray-300" : "border-gray-200 text-gray-600"} ${isRTL ? "text-right" : "text-left"}`}>
                          {isRTL ? "الاسم بناءً على الهوية (عربي)" : "Name as per ID (Arabic)"}
                        </h4>
                        <div className={`grid grid-cols-2 lg:grid-cols-4 gap-4 ${isRTL ? "rtl" : "ltr"}`}>
                          {[
                            { key: 'first_name_ar', label: isRTL ? 'الاسم الأول' : 'First Name' },
                            { key: 'second_name_ar', label: isRTL ? 'اسم الأب' : 'Second Name' },
                            { key: 'third_name_ar', label: isRTL ? 'اسم الجد' : 'Third Name' },
                            { key: 'last_name_ar', label: isRTL ? 'الاسم الأخير' : 'Last Name' },
                          ].map((field) => (
                            <div key={field.key}>
                              <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${isDark ? "text-gray-400" : "text-gray-600"}`}>{field.label}</label>
                              <input type="text" value={(data as any)[field.key]} onChange={e => setData(field.key as any, e.target.value)} dir="rtl" required={field.key === 'first_name_ar' || field.key === 'last_name_ar'}
                                className={`w-full rounded-lg px-3 py-2 text-sm outline-none transition-all ${isDark ? "bg-gray-800 border-gray-700 text-white focus:ring-brand-yellow" : "bg-gray-50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-brand-navy focus:border-transparent"}`} />
                              <InputError message={(errors as any)[field.key]} className="mt-1" />
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* EN Names Grid */}
                      <div>
                         <h4 className={`text-sm font-bold border-b pb-2 mb-4 ${isDark ? "border-gray-700 text-gray-300" : "border-gray-200 text-gray-600"} ${isRTL ? "text-right" : "text-left"}`}>
                          {isRTL ? "الاسم بناءً على الهوية (إنجليزي)" : "Name as per ID (English)"}
                        </h4>
                        <div className={`grid grid-cols-2 lg:grid-cols-4 gap-4 ${isRTL ? "rtl" : "ltr"}`}>
                          {[
                            { key: 'first_name_en', label: isRTL ? 'الاسم الأول' : 'First Name' },
                            { key: 'second_name_en', label: isRTL ? 'اسم الأب' : 'Second Name' },
                            { key: 'third_name_en', label: isRTL ? 'اسم الجد' : 'Third Name' },
                            { key: 'last_name_en', label: isRTL ? 'الاسم الأخير' : 'Last Name' },
                          ].map((field) => (
                            <div key={field.key}>
                              <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${isDark ? "text-gray-400" : "text-gray-600"}`}>{field.label}</label>
                              <input type="text" value={(data as any)[field.key]} onChange={e => setData(field.key as any, e.target.value)} dir="ltr"
                                className={`w-full rounded-lg px-3 py-2 text-sm outline-none transition-all ${isDark ? "bg-gray-800 border-gray-700 text-white focus:ring-brand-yellow" : "bg-gray-50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-brand-navy focus:border-transparent"}`} />
                              <InputError message={(errors as any)[field.key]} className="mt-1" />
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>
                  )}

                  {/* Step 2 */}
                  {currentStep === 2 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                      
                      <div className={`grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5 ${isRTL ? "rtl" : "ltr"}`}>
                        {/* National ID */}
                        <div>
                          <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${isDark ? "text-gray-400" : "text-gray-600"}`}>{isRTL ? "رقم الهوية / الإقامة" : "National ID / Resident ID"}</label>
                          <input type="text" value={data.national_id} onChange={e => setData("national_id", e.target.value)} dir="ltr" required
                            className={`w-full rounded-lg px-4 py-2.5 text-sm outline-none transition-all font-mono ${isDark ? "bg-gray-800 border-gray-700 text-white focus:ring-brand-yellow" : "bg-gray-50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-brand-navy"}`} />
                          <InputError message={errors.national_id} className="mt-1" />
                        </div>

                        {/* Phone */}
                        <div>
                          <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${isDark ? "text-gray-400" : "text-gray-600"}`}>{isRTL ? "رقم الجوال" : "Phone Number"}</label>
                          <input type="text" value={data.phone} onChange={e => setData("phone", e.target.value)} dir="ltr" placeholder="5X XXX XXXX" required
                            className={`w-full rounded-lg px-4 py-2.5 text-sm outline-none transition-all font-mono ${isDark ? "bg-gray-800 border-gray-700 text-white focus:ring-brand-yellow" : "bg-gray-50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-brand-navy"}`} />
                          <InputError message={errors.phone} className="mt-1" />
                        </div>

                        {/* Email */}
                        <div>
                          <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${isDark ? "text-gray-400" : "text-gray-600"}`}>{isRTL ? "البريد الإلكتروني" : "Email Address"}</label>
                          <input type="email" value={data.email} onChange={e => setData("email", e.target.value)} dir="ltr"
                            className={`w-full rounded-lg px-4 py-2.5 text-sm outline-none transition-all ${isDark ? "bg-gray-800 border-gray-700 text-white focus:ring-brand-yellow" : "bg-gray-50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-brand-navy"}`} />
                          <InputError message={errors.email} className="mt-1" />
                        </div>

                        {/* License Number */}
                        <div>
                          <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${isDark ? "text-gray-400" : "text-gray-600"}`}>{isRTL ? "رقم الرخصة" : "License Number"}</label>
                          <input type="text" value={data.license_number} onChange={e => setData("license_number", e.target.value)} dir="ltr" required
                            className={`w-full rounded-lg px-4 py-2.5 text-sm outline-none transition-all font-mono ${isDark ? "bg-gray-800 border-gray-700 text-white focus:ring-brand-yellow" : "bg-gray-50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-brand-navy"}`} />
                          <InputError message={errors.license_number} className="mt-1" />
                        </div>

                        {/* License Expiry */}
                        <div>
                          <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${isDark ? "text-gray-400" : "text-gray-600"}`}>{isRTL ? "تاريخ انتهاء الرخصة" : "License Expiry Date"}</label>
                          <input type="date" value={data.license_expiry_date} onChange={e => setData("license_expiry_date", e.target.value)} dir="ltr" required
                            className={`w-full rounded-lg px-4 py-2.5 text-sm outline-none transition-all ${isDark ? "bg-gray-800 border-gray-700 text-white focus:ring-brand-yellow" : "bg-gray-50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-brand-navy"}`} />
                          <InputError message={errors.license_expiry_date} className="mt-1" />
                        </div>
                      </div>

                    </div>
                  )}

                </div>

                {/* Footer Actions */}
                <div className={`px-8 py-5 border-t flex justify-between items-center ${isDark ? "bg-gray-800/50 border-gray-800" : "bg-gray-50 border-gray-100"} ${isRTL ? "flex-row-reverse" : ""}`}>
                  {currentStep === 1 ? (
                    <button type="button" onClick={closeModal} className={`text-sm font-semibold transition-colors ${isDark ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-gray-800"}`}>
                      {isRTL ? "إلغاء" : "Cancel"}
                    </button>
                  ) : (
                    <button type="button" onClick={() => setCurrentStep(1)} className={`text-sm font-semibold transition-colors ${isDark ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-gray-800"}`}>
                      {isRTL ? "السابق" : "Previous"}
                    </button>
                  )}
                  
                  <div className={`flex items-center gap-4 ${isRTL ? "flex-row-reverse" : ""}`}>
                    {currentStep === 1 ? (
                      <button type="button" onClick={(e) => { e.preventDefault(); setCurrentStep(2); }} className={`px-6 py-2.5 rounded-xl font-bold text-sm shadow-sm transition-opacity ${isDark ? "bg-brand-navy text-white hover:opacity-90" : "bg-brand-navy text-white hover:opacity-90"}`}>
                        {isRTL ? "التالي" : "Next"}
                      </button>
                    ) : (
                      <button type="submit" disabled={processing} className={`px-6 py-2.5 rounded-xl font-bold text-sm shadow-sm transition-opacity disabled:opacity-50 ${isDark ? "bg-brand-yellow text-brand-dark hover:opacity-90" : "bg-brand-yellow text-brand-dark hover:opacity-90"}`}>
                        {isEditing ? (isRTL ? "حفظ التعديلات" : "Save Changes") : (isRTL ? "إضافة السائق" : "Add Driver")}
                      </button>
                    )}
                  </div>
                </div>
              </form>
