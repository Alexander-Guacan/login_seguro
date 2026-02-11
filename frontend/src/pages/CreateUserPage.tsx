import { ErrorMessage, Field, Form, Formik, type FormikHelpers } from "formik";
import { PageHeader } from "../components/PageSection/PageHeader";
import { getRoleName, UserRole } from "../enums/userRole.enum";
import * as yup from "yup";
import { useState } from "react";
import { useUser } from "../hooks/user/useUser";
import { User } from "../models/user";
import { PasswordInput } from "../components/Form/PasswordInput";
import { SubmitButton } from "../components/Form/SubmitButton";

interface FormValues {
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  password: string;
  passwordVerification: string;
}

const initialValues: FormValues = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  passwordVerification: "",
  role: UserRole.CLIENT,
};

const validationSchema = yup.object({
  firstName: yup
    .string()
    .min(3, "Nombre muy corto")
    .max(50, "Nombre muy largo")
    .required("Este campo es obligatorio"),
  lastName: yup
    .string()
    .min(3, "Apellido muy corto")
    .max(50, "Apellido muy largo")
    .required("Este campo es obligatorio"),
  email: yup
    .string()
    .email("Ingrese un email válido")
    .required("Este campo es obligatorio"),
  password: yup
    .string()
    .min(8, "La contraseña es muy corta")
    .max(50, "La contraseña es muy larga")
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      {
        message:
          "Debe contener mayúscula, minúscula, número y carácter especial.",
      },
    )
    .required("Este campo es obligatorio"),
  passwordVerification: yup
    .string()
    .equals([yup.ref("password")], "Las contraseñas no coinciden")
    .required("Este campo es obligatorio"),
});

export function CreateUserPage() {
  const [formError, setFormError] = useState<string | null>(null);
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const { create } = useUser();

  const handleSubmit = async (
    values: FormValues,
    { setSubmitting, resetForm }: FormikHelpers<FormValues>,
  ) => {
    const { email, firstName, lastName, password, role } = values;

    const user = new User({
      email: email,
      firstName: firstName,
      lastName: lastName,
      isActive: true,
      role,
    });

    const result = await create(user, password);

    if (!result.success) {
      setFormError(result.error);
    } else {
      setFormMessage(result.message);
      resetForm();

      setTimeout(() => {
        setFormMessage(null);
      }, 3500);
    }

    setSubmitting(false);
  };

  return (
    <main className="flex flex-col gap-y-6">
      <PageHeader
        title="Crear usuario"
        breadcrumbsLabels={["Dashboard", "Usuarios", "Registrar usuario"]}
      />
      <section className="form-container">
        <header>
          <h2 className="form-container__title">Usuario</h2>
        </header>
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting, values, handleChange, handleBlur }) => (
            <Form noValidate>
              <div className="field-group">
                <label htmlFor="firstName">Nombre</label>
                <Field type="text" id="firstName" name="firstName" required />
                <ErrorMessage
                  className="alert alert--error text-xs"
                  component="p"
                  name="firstName"
                />
              </div>
              <div className="field-group">
                <label htmlFor="lastName">Apellido</label>
                <Field type="text" id="lastName" name="lastName" required />
                <ErrorMessage
                  className="alert alert--error text-xs"
                  component="p"
                  name="lastName"
                />
              </div>
              <div className="field-group">
                <label htmlFor="email">Correo electrónico</label>
                <Field type="email" id="email" name="email" required />
                <ErrorMessage
                  className="alert alert--error text-xs"
                  component="p"
                  name="email"
                />
              </div>
              <div className="field-group">
                <label htmlFor="role">Rol</label>
                <Field as="select" id="role" name="role">
                  <option value={UserRole.ADMIN}>
                    {getRoleName(UserRole.ADMIN)}
                  </option>
                  <option value={UserRole.CLIENT}>
                    {getRoleName(UserRole.CLIENT)}
                  </option>
                </Field>
                <ErrorMessage
                  className="alert alert--error text-xs"
                  component="p"
                  name="role"
                />
              </div>
              <div className="field-group">
                <label htmlFor="password">Contraseña</label>
                <PasswordInput
                  id="password"
                  name="password"
                  value={values.password}
                  required
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
                <ErrorMessage
                  className="alert alert--error text-xs"
                  component="p"
                  name="password"
                />
              </div>
              <div className="field-group">
                <label htmlFor="passwordVerification">Repetir contraseña</label>
                <PasswordInput
                  id="passwordVerification"
                  name="passwordVerification"
                  value={values.password}
                  required
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
                <ErrorMessage
                  className="alert alert--error text-xs"
                  component="p"
                  name="passwordVerification"
                />
              </div>
              <div className="flex flex-col gap-y-4">
                <SubmitButton loading={isSubmitting}>Actualizar</SubmitButton>
                {formError && (
                  <p className="alert alert--error text-xs">{formError}</p>
                )}
                {formMessage && (
                  <p className="alert alert--success">{formMessage}</p>
                )}
              </div>
            </Form>
          )}
        </Formik>
      </section>
    </main>
  );
}
