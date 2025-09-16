
import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class Register {
  isLoading=false;
  errorMessage='';
  registerForm:any;

  constructor(private fb:FormBuilder){
    this.registerForm=this.fb.group({
          fullName: ['', [Validators.required, Validators.minLength(3)]],
    username: ['', [Validators.required, Validators.minLength(3)]],
    ci: ['', [Validators.required]],
    telefono: ['', [Validators.required, Validators.pattern(/^[0-9]{8,}$/)]],
    email: ['', [Validators.required, Validators.email]],
    password: [
      '',
      [
        Validators.required,
        Validators.pattern(/^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/),
      ],
    ],
    })

  }
  async onSubmit(){
    if (this.registerForm.invalid)return;

    this.isLoading=true;
    this.errorMessage='';

    try {
      
    } catch (error) {
      
    }
  }

}
