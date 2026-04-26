import { useState, useMemo } from "react";
import debounce from "lodash/debounce";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router } from "@inertiajs/react";
import { useTheme } from "@/Contexts/ThemeContext";
import BaseDataTable, {
  type PaginationMeta,
} from "@/Components/BaseDataTable";
import { createColumnHelper } from "@tanstack/react-table";
import { motion } from "framer-motion";
import {
  Users,
  School,
  Mail,
  Phone,
  UserCheck,
} from "lucide-react";

interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  image: string | null;
  school_admin?: {
    school: {
      id: number;
      name: string;
    };
  };
}

interface Props {
  users: {
    data: User[];
    links: any[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
  };
  filters: {
    search: string;
  };
}

export default function SchoolUsersIndex({ users, filters }: Props) {
  const { isRTL, theme } = useTheme();
  const isDark = theme === "dark";
  const [search, setSearch] = useState(filters.search);

  const debouncedSearch = useMemo(
    () =>
      debounce((value: string) => {
        router.get(
          route("admin.school-admins.index"),
          { search: value },
          { preserveState: true, replace: true }
        );
      }, 300),
    []
  );

  const handleSearch = (value: string) => {
    setSearch(value);
    debouncedSearch(value);
  };

  const columnHelper = createColumnHelper<User>();

  const columns = useMemo(
    () => [
      columnHelper.accessor("name", {
        header: isRTL ? "المدير" : "Admin Name",
        cell: (info) => (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brand-navy/10 flex items-center justify-center font-bold text-sm overflow-hidden">
              {info.row.original.image ? (
                <img src={`/storage/${info.row.original.image}`} className="w-full h-full object-cover" />
              ) : (
                info.row.original.name.charAt(0)
              )}
            </div>
            <div>
              <div className="font-bold">{info.row.original.name}</div>
              <div className="text-xs text-gray-500">{info.row.original.email}</div>
            </div>
          </div>
        ),
      }),
      columnHelper.accessor("phone", {
        header: isRTL ? "الجوال" : "Phone",
      }),
      columnHelper.accessor("school_admin.school.name", {
        header: isRTL ? "المدرسة" : "School",
        cell: (info) => (
          <div className="flex items-center gap-2">
            <School className="w-4 h-4 text-brand-yellow" />
            <span>{info.getValue() || "—"}</span>
          </div>
        ),
      }),
    ],
    [isRTL]
  );

  const pagination: PaginationMeta = {
    links: users.links,
    current_page: users.current_page,
    last_page: users.last_page,
    per_page: users.per_page,
    total: users.total,
    from: users.from,
    to: users.to,
  };

  return (
    <AuthenticatedLayout
      header={<h2 className="font-bold text-xl">{isRTL ? "مدراء المدارس" : "School Admins"}</h2>}
    >
      <Head title={isRTL ? "مدراء المدارس" : "School Admins"} />

      <div className="space-y-6">
        <BaseDataTable<User>
          columns={columns}
          data={users.data}
          pagination={pagination}
          searchValue={search}
          onSearchChange={handleSearch}
          searchPlaceholder={isRTL ? "بحث بالاسم، البريد..." : "Search name, email..."}
          emptyMessage={isRTL ? "لا يوجد مدراء مدارس" : "No School Admins found"}
          emptyIcon={<UserCheck className="w-10 h-10" />}
        />
      </div>
    </AuthenticatedLayout>
  );
}
