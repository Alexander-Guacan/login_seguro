import { ErrorMessage, Field, Form, Formik, type FormikHelpers } from "formik";
import * as yup from "yup";
import { useAuth } from "../hooks/auth/useAuth";
import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { SubmitButton } from "../components/Form/SubmitButton";

interface FormValues {
  email: string;
}

const initValues: FormValues = {
  email: "",
};

const validationSchema = yup.object({
  email: yup
    .string()
    .email("Ingrese un correo válido")
    .required("Este campo es obligatorio"),
});

export function BiometricLoginPage() {
  const [formError, setFormError] = useState<string | null>(null);
  const { biometricLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (
    form: FormValues,
    { setSubmitting, resetForm }: FormikHelpers<FormValues>,
  ) => {
    setFormError(null);

    const result = await biometricLogin(form.email);

    if (!result.success) {
      setFormError(result.error);
    } else {
      resetForm();
      navigate("/dashboard");
    }

    setSubmitting(false);
  };

  return (
    <main className="content-center text-center w-full h-full p-8">
      <section className="form-container mx-auto border-0 max-w-90">
        <header>
          <h1 className="form-container__title">Iniciar sesión</h1>
        </header>
        <Formik
          initialValues={initValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting }) => (
            <Form noValidate>
              <div className="field-group">
                <label htmlFor="email">Correo electrónico</label>
                <Field type="email" id="email" name="email" />
                <ErrorMessage
                  className="alert alert--error text-xs"
                  component="p"
                  name="email"
                />
              </div>
              <SubmitButton loading={isSubmitting}>
                Huella digital o PIN
              </SubmitButton>
              {formError && (
                <p className="alert alert--error text-xs">{formError}</p>
              )}
            </Form>
          )}
        </Formik>
      </section>
      <article className="py-6">
        <p>
          ¿No tienes una cuenta?{" "}
          <Link className="link" to={"/login"}>
            Registrate
          </Link>
        </p>
      </article>
    </main>
  );
}
