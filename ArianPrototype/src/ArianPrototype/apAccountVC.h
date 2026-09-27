//
//  apAccountVC.h
//  ArianPrototype
//
//  Created by Mihailo Despotovic on 12/25/13.
//  Copyright (c) 2013 MiRteh. All rights reserved.
//

#import <UIKit/UIKit.h>

@interface apAccountVC : UIViewController

@property IBOutlet UITextField *usernameTF;
@property IBOutlet UITextField *passwordTF;

@property IBOutlet UIButton *loginButton;

@property IBOutlet UILabel *emailLabel;
@property IBOutlet UILabel *paymentLabel;
@property IBOutlet UILabel *billLabel;
@property IBOutlet UILabel *shipLabel;
@property IBOutlet UILabel *promoLabel;

@property IBOutlet UIActivityIndicatorView *spinner;

@property IBOutlet UITextView *billTV;
@property IBOutlet UITextView *shipTV;

@property IBOutlet UITextField *emailTF;
@property IBOutlet UITextField *payMethodTF;
@property IBOutlet UITextField *payExpTF;
@property IBOutlet UITextField *payNumberTF;
@property IBOutlet UIImageView *cardImage;
@property IBOutlet UIImageView *billImage;
@property IBOutlet UIImageView *shipImage;

@property IBOutlet UISwitch *promoSwitch;

- (IBAction) loginAction;
- (void) refreshView;
- (void) loginDone;


@end
