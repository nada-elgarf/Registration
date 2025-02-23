const VALIDATION_RULES = {
  name: {
      pattern: /^[a-zA-Z]+(?: [a-zA-Z]+)*$/,
      minLength: 2,
      maxLength: 50,
      message: "Please enter a valid name (only letters and spaces)"
  },
  email: {
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: "Please enter a valid email address"
  },
  password: {
      minLength: 4,  
      pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      message: "Password must be at least 4 characters and include uppercase, lowercase, number, and special character. Example: nada@@1234As"
  }
};


class AuthError extends Error {
  constructor(message, field) {
      super(message);
      this.field = field;
  }
}

const showToast = (message, type = 'success') => {
  const toast = document.createElement('div');
  toast.className = `alert alert-${type} alert-dismissible fade show`;
  toast.innerHTML = `
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  `;
  document.querySelector('.toast-container').appendChild(toast);
  setTimeout(() => toast.remove(), 5000);
};

const setLoading = (element, isLoading) => {
  element.classList.toggle('loading', isLoading);
};

const validateField = (value, rules, fieldName) => {
  if (!value) throw new AuthError("This field is required", fieldName);
  
  if (rules.minLength && value.length < rules.minLength) {
      throw new AuthError(`Minimum ${rules.minLength} characters required`, fieldName);
  }

  if (rules.maxLength && value.length > rules.maxLength) {
      throw new AuthError(`Maximum ${rules.maxLength} characters allowed`, fieldName);
  }

  if (rules.pattern && !rules.pattern.test(value)) {
      throw new AuthError(rules.message, fieldName);
  }
};

const clearErrors = () => {
  document.querySelectorAll('.validation-message').forEach(el => el.textContent = '');
  document.querySelectorAll('.form-control').forEach(el => {
      el.classList.remove('is-invalid');
      el.classList.remove('is-valid');
  });
};

const showError = (fieldId, message) => {
  const field = document.getElementById(fieldId);
  const errorElement = document.getElementById(`${fieldId}Error`);
  if (field && errorElement) {
      field.classList.add('is-invalid');
      errorElement.textContent = message;
  }
};

const resetPasswordStrength = () => {
  const strengthBar = document.querySelector('.password-strength');
  const hint = document.getElementById('passwordHint');
  if (strengthBar) {
      strengthBar.style.width = '0%';
      strengthBar.style.backgroundColor = '';
  }
  if (hint) {
      hint.textContent = '';
  }
};

const updatePasswordStrength = (password) => {
  const strengthBar = document.querySelector('.password-strength');
  const hint = document.getElementById('passwordHint');
  
  let strength = 0;
  let message = '';

  if (password.length >= 4) strength += 25;
  if (password.match(/[A-Z]/)) strength += 25;
  if (password.match(/[0-9]/)) strength += 25;
  if (password.match(/[^A-Za-z0-9]/)) strength += 25;

  strengthBar.style.width = `${strength}%`;
  
  if (strength <= 25) {
      strengthBar.style.backgroundColor = '#dc3545';
      message = 'Weak password';
  } else if (strength <= 50) {
      strengthBar.style.backgroundColor = '#ffc107';
      message = 'Moderate password';
  } else if (strength <= 75) {
      strengthBar.style.backgroundColor = '#17a2b8';
      message = 'Strong password';
  } else {
      strengthBar.style.backgroundColor = '#28a745';
      message = 'Very strong password';
  }

  hint.textContent = message;
};

const handleRegister = async (e) => {
  e.preventDefault();
  const form = e.target;
  const submitButton = form.querySelector('button[type="submit"]');
  
  clearErrors();
  setLoading(submitButton, true);

  try {
      const name = document.getElementById('name').value.trim();
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;

      validateField(name, VALIDATION_RULES.name, 'name');
      validateField(email, VALIDATION_RULES.email, 'email');
      validateField(password, VALIDATION_RULES.password, 'password');

      const users = JSON.parse(localStorage.getItem('users')) || [];
      if (users.some(user => user.email === email)) {
          throw new AuthError('Email already registered', 'email');
      }

      users.push({ name, email, password });
      localStorage.setItem('users', JSON.stringify(users));

      showToast('Registration successful! Please sign in.');
      toggleForm('login');
      form.reset();
  } catch (error) {
      if (error instanceof AuthError) {
          showError(error.field, error.message);
      } else {
          showToast('An unexpected error occurred', 'danger');
      }
  } finally {
      setLoading(submitButton, false);
  }
};

const handleLogin = async (e) => {
  e.preventDefault();
  const form = e.target;
  const submitButton = form.querySelector('button[type="submit"]');
  
  clearErrors();
  setLoading(submitButton, true);

  try {
      const email = document.getElementById('loginEmail').value.trim();
      const password = document.getElementById('loginPassword').value;

      validateField(email, VALIDATION_RULES.email, 'loginEmail');
      if (!password) throw new AuthError('Password is required', 'loginPassword');

      const users = JSON.parse(localStorage.getItem('users')) || [];
      const user = users.find(u => u.email === email && u.password === password);

      if (!user) {
          throw new AuthError('Invalid email or password', 'loginEmail');
      }

      localStorage.setItem('loggedInUser', JSON.stringify(user));
      showToast('Login successful!');
      loadProfile();
      form.reset();
  } catch (error) {
      if (error instanceof AuthError) {
          showError(error.field, error.message);
      } else {
          showToast('An unexpected error occurred', 'danger');
      }
  } finally {
      setLoading(submitButton, false);
  }
};

const toggleForm = (formId) => {
  ['register', 'login', 'profile'].forEach(id => {
      document.getElementById(id).classList.add('d-none');
  });
  document.getElementById(formId).classList.remove('d-none');
  clearErrors();
  resetPasswordStrength();
};

const loadProfile = () => {
  try {
      const user = JSON.parse(localStorage.getItem('loggedInUser'));
      if (!user) return;

      document.getElementById('profileName').textContent = user.name;
      document.getElementById('profileEmail').textContent = user.email;
      toggleForm('profile');
  } catch (error) {
      showToast('Error loading profile', 'danger');
      logoutUser();
  }
};

const logoutUser = () => {
  localStorage.removeItem('loggedInUser');
  showToast('Logged out successfully');
  toggleForm('login');
};

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('registerForm').addEventListener('submit', handleRegister);
  document.getElementById('loginForm').addEventListener('submit', handleLogin);
  document.getElementById('password').addEventListener('input', (e) => updatePasswordStrength(e.target.value));
  loadProfile();
});