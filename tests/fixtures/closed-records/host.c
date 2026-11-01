#include <stdint.h>
#include <stddef.h>
#include <stdio.h>
extern void cr_init(void);
extern void cr_run(const uint8_t **,size_t *);
extern void cr_collect(void);
int main(void){const uint8_t *p=NULL;size_t n=0;cr_init();cr_run(&p,&n);fwrite(p,1,n,stdout);cr_collect();return 0;}
