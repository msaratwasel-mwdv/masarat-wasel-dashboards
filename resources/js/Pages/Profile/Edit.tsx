import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import SchoolAuthenticatedLayout from "@/Layouts/SchoolAuthenticatedLayout";
import { PageProps } from "@/types";
import { Head, usePage } from "@inertiajs/react";
import DeleteUserForm from "./Partials/DeleteUserForm";
import UpdatePasswordForm from "./Partials/UpdatePasswordForm";
import UpdateProfileInformationForm from "./Partials/UpdateProfileInformationForm";

export default function Edit({
  mustVerifyEmail,
  status,
}: PageProps<{ mustVerifyEmail: boolean; status?: string }>) {
  const user = usePage().props.auth.user;

  // Determine which layout to use based on the user's role
  const Layout =
    user.role === "school_admin"
      ? SchoolAuthenticatedLayout
      : AuthenticatedLayout;

  return (
    <Layout
      user={user}
      header={
        <h2 className="text-xl font-semibold leading-tight text-gray-800">
          Profile
        </h2>
      }
    >
      <Head title="Profile" />

      <div className="py-12">
        <div className="mx-auto max-w-7xl space-y-6 sm:px-6 lg:px-8">
          <div className="bg-white p-4 shadow sm:rounded-lg sm:p-8">
            <UpdateProfileInformationForm
              mustVerifyEmail={mustVerifyEmail}
              status={status}
              className="max-w-xl"
            />
          </div>

          <div className="bg-white p-4 shadow sm:rounded-lg sm:p-8">
            <UpdatePasswordForm className="max-w-xl" />
          </div>

          <div className="bg-white p-4 shadow sm:rounded-lg sm:p-8">
            <DeleteUserForm className="max-w-xl" />
          </div>
        </div>
      </div>
    </Layout>
  );
}
